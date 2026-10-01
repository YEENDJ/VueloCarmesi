import { createHash, timingSafeEqual } from 'node:crypto'
import {
  FirmaInvalidaError, type Checkout, type DatosCliente, type EventoPago,
  type PagoACobrar, type ProveedorPagos,
} from './proveedor'

const URL_CHECKOUT = 'https://checkout.wompi.co/p/'
const URL_API = {
  prueba: 'https://sandbox.wompi.co/v1',
  produccion: 'https://production.wompi.co/v1',
} as const

export interface ConfigWompi {
  llavePublica: string
  llavePrivada: string
  /** «Secreto de eventos» del panel: firma los webhooks. */
  secretoEventos: string
  /** «Secreto de integridad» del panel: firma el monto del checkout. */
  secretoIntegridad: string
}

/** Lo que Wompi manda en `data.transaction` y en `GET /transactions`. */
interface TransaccionWompi {
  id: string
  reference: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  amount_in_cents: number
  payment_method_type?: string
  status_message?: string | null
  created_at?: string
}

interface EventoWompi {
  event: string
  data: Record<string, unknown>
  environment?: string
  signature?: { properties?: string[]; checksum?: string }
  timestamp?: number
}

/**
 * Lo mínimo que tiene que cubrir la firma de un evento. La lista de campos
 * firmados viene en el propio evento: sin este piso, alguien podría armarla con
 * otros campos y reutilizar el checksum de un evento viejo.
 */
const PROPIEDADES_FIRMADAS = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']

const ESTADOS: Record<TransaccionWompi['status'], EventoPago['estado']> = {
  PENDING: 'pendiente',
  APPROVED: 'aprobado',
  DECLINED: 'rechazado',
  VOIDED: 'anulado',
  ERROR: 'error',
}

const METODOS: Record<string, string> = {
  CARD: 'tarjeta',
  NEQUI: 'nequi',
  PSE: 'pse',
  BANCOLOMBIA_TRANSFER: 'bancolombia',
  BANCOLOMBIA_QR: 'bancolombia_qr',
  DAVIPLATA: 'daviplata',
}

/**
 * Adaptador de Wompi. Se activa con `PAGOS_PROVEEDOR=wompi`.
 *
 * El modo sale del prefijo de las llaves: `pub_test_` va contra el sandbox y
 * nunca cobra; `pub_prod_` cobra de verdad. Mezclar llaves de los dos
 * ambientes es un error de configuración y el constructor lo rechaza.
 *
 * Usa el Web Checkout (redirección a checkout.wompi.co), así que el sitio no
 * toca datos de tarjeta. Docs: https://docs.wompi.co
 */
export class ProveedorWompi implements ProveedorPagos {
  readonly nombre = 'wompi'
  readonly modo: 'prueba' | 'produccion'

  constructor(
    private readonly config: ConfigWompi = configDesdeEnv(),
    private readonly http: typeof fetch = fetch,
  ) {
    const faltan = (Object.keys(config) as (keyof ConfigWompi)[]).filter(k => !config[k])
    if (faltan.length) throw new Error(`Faltan credenciales de Wompi: ${faltan.join(', ')}`)

    const modoPublica = modoDeLlave(config.llavePublica, 'pub')
    const modoPrivada = modoDeLlave(config.llavePrivada, 'prv')
    if (!modoPublica || !modoPrivada) throw new Error('Las llaves de Wompi no tienen el formato pub_/prv_ esperado')
    if (modoPublica !== modoPrivada) throw new Error('La llave pública y la privada de Wompi son de ambientes distintos')
    this.modo = modoPublica
  }

  crearCheckout(pago: PagoACobrar, cliente: DatosCliente, urlRetorno: string): Promise<Checkout> {
    if (!Number.isInteger(pago.monto) || pago.monto <= 0) {
      return Promise.reject(new Error(`Monto inválido para Wompi: ${pago.monto}`))
    }
    const centavos = pago.monto * 100
    const retorno = new URL(urlRetorno)
    retorno.searchParams.set('ref', pago.referencia)

    const url = new URL(URL_CHECKOUT)
    const p = url.searchParams
    p.set('public-key', this.config.llavePublica)
    p.set('currency', pago.moneda)
    p.set('amount-in-cents', String(centavos))
    p.set('reference', pago.referencia)
    p.set('signature:integrity', sha256(`${pago.referencia}${centavos}${pago.moneda}${this.config.secretoIntegridad}`))
    // El firewall de Wompi responde 403 a todo el checkout si el retorno es
    // local. En desarrollo se omite: Wompi muestra su propio resultado y el
    // webhook actualiza el pedido igual.
    if (!esLocal(retorno)) p.set('redirect-url', retorno.toString())
    p.set('customer-data:email', cliente.email)
    p.set('customer-data:full-name', cliente.nombre)
    const telefono = telefonoNacional(cliente.telefono)
    if (telefono) {
      p.set('customer-data:phone-number', telefono)
      p.set('customer-data:phone-number-prefix', '+57')
    }
    return Promise.resolve({ url: url.toString() })
  }

  /**
   * El checksum va en el body (`signature.checksum`) y en la cabecera
   * `x-event-checksum`. Es SHA-256 de los valores de `signature.properties`
   * (rutas dentro de `data`), luego `timestamp`, luego el secreto de eventos.
   */
  verificarWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): EventoPago {
    let evento: EventoWompi
    try {
      evento = JSON.parse(rawBody.toString('utf8')) as EventoWompi
    } catch {
      throw new FirmaInvalidaError()
    }

    const cabecera = headers['x-event-checksum']
    const recibido = evento.signature?.checksum ?? (typeof cabecera === 'string' ? cabecera : undefined)
    const propiedades = evento.signature?.properties
    if (!recibido || !Array.isArray(propiedades) || evento.timestamp == null) throw new FirmaInvalidaError()
    if (!PROPIEDADES_FIRMADAS.every(req => propiedades.includes(req))) throw new FirmaInvalidaError()

    const valores = propiedades.map(ruta => valorEn(evento.data, ruta))
    if (valores.some(v => v === undefined)) throw new FirmaInvalidaError()
    const esperado = sha256(`${valores.join('')}${evento.timestamp}${this.config.secretoEventos}`)
    if (!hexIgual(recibido, esperado)) throw new FirmaInvalidaError()

    const tx = evento.data.transaction as TransaccionWompi | undefined
    if (evento.event !== 'transaction.updated' || !tx) {
      // Firmado pero no es de transacción (p. ej. nequi_token.updated): no hay
      // nada que aplicar. Se rechaza igual que una firma mala para no inventar
      // un EventoPago; Wompi reintenta, pero ese tipo de evento no lo usamos.
      throw new FirmaInvalidaError()
    }
    return aEvento(tx, evento)
  }

  /**
   * Una referencia puede tener varias transacciones si el cliente reintenta
   * dentro del checkout. Gana la aprobada; si no hay, la que siga en curso; si
   * tampoco, la más reciente.
   */
  async consultarTransaccion(referencia: string): Promise<EventoPago | null> {
    const url = `${URL_API[this.modo]}/transactions?reference=${encodeURIComponent(referencia)}`
    const res = await this.http(url, { headers: { Authorization: `Bearer ${this.config.llavePrivada}` } })
    if (!res.ok) throw new Error(`Wompi respondió ${res.status} al consultar ${referencia}`)

    const { data } = (await res.json()) as { data?: TransaccionWompi[] }
    const txs = (data ?? []).filter(t => t.reference === referencia)
    if (!txs.length) return null

    const tx =
      txs.find(t => t.status === 'APPROVED') ??
      txs.find(t => t.status === 'PENDING') ??
      [...txs].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
    return aEvento(tx, tx)
  }
}

export function configDesdeEnv(env: NodeJS.ProcessEnv = process.env): ConfigWompi {
  return {
    llavePublica: env.WOMPI_LLAVE_PUBLICA?.trim() ?? '',
    llavePrivada: env.WOMPI_LLAVE_PRIVADA?.trim() ?? '',
    secretoEventos: env.WOMPI_SECRETO_EVENTOS?.trim() ?? '',
    secretoIntegridad: env.WOMPI_SECRETO_INTEGRIDAD?.trim() ?? '',
  }
}

function aEvento(tx: TransaccionWompi, payload: unknown): EventoPago {
  const estado = ESTADOS[tx.status]
  if (!estado) throw new Error(`Estado de Wompi desconocido: ${tx.status}`)
  const metodo = tx.payment_method_type
  return {
    referencia: tx.reference,
    proveedorTxId: tx.id,
    estado,
    monto: Math.round(tx.amount_in_cents / 100),
    metodo: metodo ? (METODOS[metodo] ?? metodo.toLowerCase()) : undefined,
    motivo: tx.status_message ?? undefined,
    payload,
  }
}

function modoDeLlave(llave: string, tipo: 'pub' | 'prv'): 'prueba' | 'produccion' | null {
  if (llave.startsWith(`${tipo}_test_`)) return 'prueba'
  if (llave.startsWith(`${tipo}_prod_`)) return 'produccion'
  return null
}

/** `transaction.amount_in_cents` → data.transaction.amount_in_cents */
function valorEn(data: Record<string, unknown>, ruta: string): unknown {
  return ruta.split('.').reduce<unknown>(
    (obj, clave) => (obj != null && typeof obj === 'object' ? (obj as Record<string, unknown>)[clave] : undefined),
    data,
  )
}

function esLocal(url: URL): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
}

/** Wompi pide el número sin indicativo; el formulario puede traerlo con +57. */
function telefonoNacional(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, '')
  if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2)
  return digitos.length >= 7 ? digitos : null
}

function sha256(texto: string): string {
  return createHash('sha256').update(texto).digest('hex')
}

function hexIgual(a: string, b: string): boolean {
  const ba = Buffer.from(a.toLowerCase())
  const bb = Buffer.from(b.toLowerCase())
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

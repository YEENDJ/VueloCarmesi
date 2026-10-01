import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  FirmaInvalidaError, type Checkout, type DatosCliente, type EventoPago,
  type PagoACobrar, type ProveedorPagos,
} from './proveedor'

export const CABECERA_FIRMA_FALSA = 'x-firma-prueba'

/**
 * Pasarela de mentira, para pruebas y desarrollo. Se activa con
 * `PAGOS_PROVEEDOR=falso` y nunca cobra nada: todos sus pagos quedan con
 * `modo = prueba`.
 *
 * Firma sus webhooks con HMAC-SHA256 de verdad, igual que una pasarela real,
 * para que la verificación de firma también se pruebe. Sin
 * `PAGOS_FALSO_SECRETO` no acepta ningún webhook.
 */
export class ProveedorFalso implements ProveedorPagos {
  readonly nombre = 'falso'
  readonly modo = 'prueba' as const

  private readonly transacciones = new Map<string, EventoPago>()

  constructor(private readonly secreto = process.env.PAGOS_FALSO_SECRETO ?? '') {}

  /** Sin página de pago: devuelve al cliente directo a la de resultado. */
  crearCheckout(pago: PagoACobrar, _cliente: DatosCliente, urlRetorno: string): Promise<Checkout> {
    const url = new URL(urlRetorno)
    url.searchParams.set('ref', pago.referencia)
    return Promise.resolve({ url: url.toString() })
  }

  verificarWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): EventoPago {
    const firma = headers[CABECERA_FIRMA_FALSA]
    if (!this.secreto || typeof firma !== 'string' || !firmaIgual(firma, this.firmar(rawBody))) {
      throw new FirmaInvalidaError()
    }
    const evento = JSON.parse(rawBody.toString('utf8')) as EventoPago
    return { ...evento, payload: evento }
  }

  consultarTransaccion(referencia: string): Promise<EventoPago | null> {
    return Promise.resolve(this.transacciones.get(referencia) ?? null)
  }

  // --- Solo para pruebas ---------------------------------------------------

  /**
   * Hace como si el cliente hubiera pagado (o fallado) en la pasarela. Deja la
   * transacción consultable y devuelve el webhook firmado que mandaría la
   * pasarela, listo para postear.
   */
  simular(
    referencia: string,
    estado: EventoPago['estado'],
    monto: number,
    extra: Partial<Pick<EventoPago, 'metodo' | 'motivo' | 'proveedorTxId'>> = {},
  ): { evento: EventoPago; body: Buffer; firma: string } {
    const anterior = this.transacciones.get(referencia)
    const evento: EventoPago = {
      referencia,
      proveedorTxId: extra.proveedorTxId ?? anterior?.proveedorTxId ?? `falso_${randomBytes(6).toString('hex')}`,
      estado,
      monto,
      metodo: extra.metodo ?? 'tarjeta',
      motivo: extra.motivo,
      payload: {},
    }
    this.transacciones.set(referencia, evento)
    const body = Buffer.from(JSON.stringify(evento))
    return { evento, body, firma: this.firmar(body) }
  }

  firmar(body: Buffer): string {
    return createHmac('sha256', this.secreto).update(body).digest('hex')
  }
}

function firmaIgual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

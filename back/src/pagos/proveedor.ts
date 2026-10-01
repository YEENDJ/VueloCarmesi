import type { EstadoPago } from './estados'

/**
 * Lo que dice la pasarela de una transacción, ya traducido a nuestro
 * vocabulario. Cada adaptador convierte sus propios estados (APPROVED,
 * DECLINED, VOIDED...) a estos.
 */
export interface EventoPago {
  referencia: string
  proveedorTxId: string
  /** `pendiente` aquí significa «la transacción existe y sigue en curso». */
  estado: Exclude<EstadoPago, 'expirado'>
  /** Lo que la pasarela dice que cobró, en pesos enteros. */
  monto: number
  metodo?: string
  motivo?: string
  payload: unknown
}

export interface DatosCliente {
  nombre: string
  email: string
  telefono: string
}

export interface Checkout {
  /** A dónde se manda al cliente para pagar. */
  url: string
}

export interface PagoACobrar {
  referencia: string
  monto: number
  moneda: string
  descripcion: string
}

/**
 * Lo único que la lógica de pagos sabe de la pasarela. Los estados, el
 * vencimiento y los nueve casos del spec viven fuera de aquí, así que cambiar
 * de pasarela es escribir otro adaptador.
 */
export interface ProveedorPagos {
  /** Se guarda en `Pago.proveedor`. */
  readonly nombre: string
  /** `prueba` en sandbox, `produccion` con credenciales reales. */
  readonly modo: 'prueba' | 'produccion'
  crearCheckout(pago: PagoACobrar, cliente: DatosCliente, urlRetorno: string): Promise<Checkout>
  /** Valida la firma sobre el body crudo. Lanza si el evento no es auténtico. */
  verificarWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): EventoPago
  /** El estado actual según la pasarela, o null si no conoce la referencia. */
  consultarTransaccion(referencia: string): Promise<EventoPago | null>
}

export const PROVEEDOR_PAGOS = Symbol('PROVEEDOR_PAGOS')

/** La firma del webhook no es válida. El controller responde 401. */
export class FirmaInvalidaError extends Error {}

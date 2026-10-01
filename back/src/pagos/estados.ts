import { HORAS_TOPE_PENDIENTE } from './config'

export const ESTADOS_PAGO = ['pendiente', 'aprobado', 'rechazado', 'anulado', 'expirado', 'error'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

/**
 * A dónde puede ir un pago desde cada estado. Solo hacia adelante: un rechazo
 * que llega tarde no deshace una aprobación, y el mismo evento dos veces no se
 * aplica dos veces.
 *
 * `expirado` no es final a propósito. Lo pone el vencimiento cuando el pedido
 * se queda sin respuesta, pero el cliente pudo seguir en la página de la
 * pasarela y pagar después; ese pago tiene que poder registrarse (caso 5).
 *
 * `rechazado` tampoco es final, pero solo hacia `aprobado`: en el checkout de
 * la pasarela el cliente puede reintentar con la misma referencia después de
 * un rechazo, y esa aprobación es dinero cobrado (caso 10).
 */
const TRANSICIONES: Record<EstadoPago, readonly EstadoPago[]> = {
  pendiente: ['aprobado', 'rechazado', 'expirado', 'error'],
  expirado: ['aprobado', 'rechazado', 'error'],
  error: ['aprobado', 'rechazado'],
  aprobado: ['anulado'],
  rechazado: ['aprobado'],
  anulado: [],
}

export function puedeTransicionar(desde: string, hacia: string): boolean {
  return (TRANSICIONES[desde as EstadoPago] ?? []).includes(hacia as EstadoPago)
}

type PagoResumen = { estado: string; proveedorTxId: string | null; createdAt: Date }

/**
 * Si hay un pago que la pasarela ya tiene y el banco no ha respondido, sin
 * pasar el tope (caso 4). Mientras lo haya, el pedido o la reserva no vence y
 * no se abre un intento nuevo: dos en paralelo terminan en un cobro doble.
 */
export function tienePagoEnCurso(pagos: PagoResumen[], ahora: Date): boolean {
  return pagos.some(p =>
    p.estado === 'pendiente' && p.proveedorTxId != null &&
    ahora.getTime() - p.createdAt.getTime() < HORAS_TOPE_PENDIENTE * 3_600_000,
  )
}

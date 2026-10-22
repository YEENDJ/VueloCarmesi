import { pedir } from './pedidos'

/**
 * La página pública «mi reserva»: cómo va una reserva sin tener cuenta. Gemela
 * de lib/pedidos.ts; habla con `GET /reservas/consulta/:token` y
 * `POST /reservas/consulta` (back/src/reservas). La vista no trae datos del
 * cliente: el enlace se puede reenviar.
 */

/** Los estados de back/prisma/schema.prisma (Reserva.estado). */
export type EstadoReservaPublica =
  | 'pendiente' | 'pendiente_pago' | 'confirmada' | 'cancelada' | 'expirada' | 'requiere_revision'

export interface ReservaPublica {
  codigo: string
  estado: EstadoReservaPublica
  /** Confirmada y con la fecha ya pasada: se calcula en el backend, no se guarda. */
  realizada: boolean
  /** `slug` nulo si la experiencia ya no está en el sitio: el nombre queda sin enlace. */
  experiencia: { nombre: string; slug: string | null; imagen: string | null }
  /** YYYY-MM-DD, el día de la experiencia. */
  fecha: string
  cantidadPersonas: number
  /** Nulos en las reservas de antes de la pasarela. */
  total: number | null
  porcentajeAbono: number | null
  montoAbono: number | null
  abonoPagado: boolean
  creadoEn: string
  /** Hasta cuándo se puede pagar el abono. Solo en `pendiente_pago`. */
  venceEn: string | null
  /** El banco tiene un pago del abono en curso: no se ofrece pagar de nuevo. */
  pagoEnCurso?: boolean
  referenciaPago: string | null
  /** Cuándo llegó a cada paso. Nulo el que no ha llegado o no tiene registro. */
  fechas: { recibida: string; abono: string | null; confirmada: string | null }
}

export { ErrorConsulta } from './pedidos'

export const obtenerReserva = (token: string) =>
  pedir<ReservaPublica>(`/reservas/consulta/${encodeURIComponent(token)}`)

export const consultarReserva = (codigo: string, email: string) =>
  pedir<{ token: string }>('/reservas/consulta', { method: 'POST', body: JSON.stringify({ codigo, email }) })

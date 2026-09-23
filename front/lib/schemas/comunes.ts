/**
 * Reglas que comparten los formularios públicos.
 *
 * Viven aquí y no copiadas en cada esquema porque tienen que cuadrar con el
 * backend: si el front acepta un teléfono que el DTO rechaza, el visitante ve
 * «hubo un problema» sin saber qué corregir.
 */

/** La misma regla de teléfono que valida el backend en `create-reserva.dto.ts`. */
export const TELEFONO_REGEX = /^\+?(?:[\s-]*\d){7,15}[\s-]*$/

const TZ = 'America/Bogota'

/** Mismo horizonte que `back/src/reservas/fecha-reserva.util.ts`. */
export const MESES_HORIZONTE_RESERVA = 6

/** Un día en Colombia desplazado `dias` y `meses`, como `YYYY-MM-DD`. */
function diaBogota(dias = 0, meses = 0): string {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: TZ })
  const d = new Date(`${hoy}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + meses)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Mañana, en hora de Colombia: el `min` de los calendarios. */
export const fechaMinima = (): string => diaBogota(1)

/** El último día que se puede reservar: el `max` del calendario de reserva. */
export const fechaMaximaReserva = (): string => diaBogota(0, MESES_HORIZONTE_RESERVA)

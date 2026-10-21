/**
 * Cuándo se puede eliminar un producto o una experiencia.
 *
 * Al borrar, sus pedidos y reservas se quedan en el historial con la copia del
 * nombre que guardaron al comprar (la relación pasa a nula). Eso solo es seguro
 * con los que ya cerraron su ciclo: un pedido pagado y sin despachar todavía
 * hay que enviarlo, y una reserva confirmada para el sábado todavía hay que
 * atenderla. Mientras exista alguno así, el borrado se rechaza con la lista.
 */

/** Los que faltan por despachar o resolver. `enviado`, `entregado`, `cancelado` y `expirado` ya cerraron. */
export const PEDIDO_EN_CURSO = ['pendiente', 'pendiente_pago', 'pagado', 'requiere_revision']

/** Sin resolver. Una `confirmada` también cuenta si su fecha es de hoy en adelante. */
export const RESERVA_SIN_RESOLVER = ['pendiente', 'pendiente_pago', 'requiere_revision']

const ESTADO_LEGIBLE: Record<string, string> = {
  pendiente: 'pendiente',
  pendiente_pago: 'esperando pago',
  pagado: 'pagado, sin enviar',
  requiere_revision: 'en revisión',
  confirmada: 'confirmada',
}

const MAX_LISTADOS = 5

/** «1 pedido sin despachar», «3 pedidos sin despachar». */
const cuantos = (n: number, que: string) => `${n} ${n === 1 ? que.replace('s ', ' ') : que}`

export type Bloqueante = { id: string; etiqueta: string; estado: string }

/**
 * Lo que ve el panel en la alerta: un resumen y, por cada uno que bloquea, su
 * id para abrir el detalle. `motivo` es el mismo texto completo del 409.
 */
export function bloqueo(
  que: 'pedidos sin despachar' | 'reservas en curso',
  accion: string,
  filas: Bloqueante[],
) {
  if (filas.length === 0) return null
  return {
    motivo: motivoBloqueo(que, accion, filas),
    resumen: `Tiene ${cuantos(filas.length, que)}. ${accion}.`,
    pendientes: filas.slice(0, MAX_LISTADOS).map(f => ({
      id: f.id, etiqueta: f.etiqueta, estado: ESTADO_LEGIBLE[f.estado] ?? f.estado,
    })),
    restantes: Math.max(0, filas.length - MAX_LISTADOS),
  }
}

export type Bloqueo = NonNullable<ReturnType<typeof bloqueo>>

/** «Tiene 2 pedidos sin cerrar: VC-AB12 (pagado, sin enviar), … Despáchalos o cancélalos …». */
export function motivoBloqueo(
  que: 'pedidos sin despachar' | 'reservas en curso',
  accion: string,
  filas: { etiqueta: string; estado: string }[],
): string {
  const lista = filas
    .slice(0, MAX_LISTADOS)
    .map(f => `${f.etiqueta} (${ESTADO_LEGIBLE[f.estado] ?? f.estado})`)
    .join(', ')
  const resto = filas.length > MAX_LISTADOS ? ` y ${filas.length - MAX_LISTADOS} más` : ''
  return `No se puede eliminar: tiene ${cuantos(filas.length, que)}: ${lista}${resto}. ${accion}`
}

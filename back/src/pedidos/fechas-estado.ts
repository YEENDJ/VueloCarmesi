/**
 * Cuándo llegó un pedido a cada paso del avance: lo que la página «mi pedido»
 * muestra bajo Pagado, Enviado y Entregado. «Recibido» es `createdAt`.
 *
 * Al pasar a un paso se guarda su hora, salvo que ya la tuviera: una
 * corrección Enviado → Pagado no le cambia al cliente la hora en que pagó.
 * Y se borran las de los pasos que vienen después, porque ya no ocurrieron:
 * si el pedido vuelve a salir, queda la hora nueva y no la del clic equivocado.
 *
 * Cancelado, expirado y en revisión no son pasos del avance: no tocan nada.
 */

const PASOS = ['pagado', 'enviado', 'entregado'] as const
type Paso = (typeof PASOS)[number]
const COLUMNA = { pagado: 'pagadoEn', enviado: 'enviadoEn', entregado: 'entregadoEn' } as const

export type FechasEstado = { pagadoEn: Date | null; enviadoEn: Date | null; entregadoEn: Date | null }

export function fechasAlPasarA(
  destino: string, actuales: Partial<FechasEstado>, ahora = new Date(),
): Partial<FechasEstado> {
  const i = PASOS.indexOf(destino as Paso)
  if (i === -1) return {}
  const cambios: Partial<FechasEstado> = { [COLUMNA[PASOS[i]]]: actuales[COLUMNA[PASOS[i]]] ?? ahora }
  for (const despues of PASOS.slice(i + 1)) cambios[COLUMNA[despues]] = null
  return cambios
}

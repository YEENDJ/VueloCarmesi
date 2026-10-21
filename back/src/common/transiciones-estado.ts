/**
 * A qué estado puede pasar a mano un pedido o una reserva desde el panel.
 *
 * Una sola tabla para los dos lados: el backend la usa para rechazar un cambio
 * y el panel, su gemela en front/lib/admin/transiciones.ts, para ofrecer solo
 * lo que se puede. Si cambia una, cambia la otra.
 *
 * Las reglas:
 * - Se avanza en el orden del negocio: pagado → enviado → entregado.
 * - Hacia atrás solo como corrección, y solo si el cambio no tuvo efectos
 *   fuera del panel. Enviado → Pagado no mandó correo ni movió stock; Cancelado
 *   ya devolvió unidades que otro pudo comprar, y Confirmada ya le escribió al
 *   cliente: esos no se deshacen.
 * - Con un pago en curso en el banco no se marca pagado ni se cancela a mano:
 *   la pasarela está por responder y adelantarse termina en un cobro doble o en
 *   un pago de algo cancelado.
 * - Una reserva confirmada cuya fecha pasó ya se realizó: no se cancela.
 *
 * Los estados que pone la pasarela (pendiente_pago, expirado, requiere_revision)
 * no son destinos: solo se sale de ellos.
 */

export interface ContextoCambio {
  /** Hay un pago que el banco tiene y no ha respondido (ver pagos/estados.ts). */
  pagoEnCurso: boolean
  /** La fecha de la reserva es anterior a hoy en Bogotá. Siempre false en pedidos. */
  fechaPasada: boolean
}

export interface OpcionEstado {
  destino: string
  /** `correccion`: hacia atrás, para enmendar un clic. El panel la ofrece aparte. */
  tipo: 'avance' | 'correccion'
  /** Por qué no se puede ahora mismo, o nulo si se puede. */
  bloqueo: string | null
}

type Regla = { destino: string; tipo?: 'correccion'; bloqueo?: (c: ContextoCambio) => string | null }

const PAGO_EN_CURSO = 'Hay un pago en curso con el banco. Espera a que se resuelva para no cobrar dos veces'
const enCurso = (c: ContextoCambio) => (c.pagoEnCurso ? PAGO_EN_CURSO : null)
const fechaPasada = (c: ContextoCambio) =>
  c.fechaPasada ? 'La fecha de la reserva ya pasó' : null
const yaRealizada = (c: ContextoCambio) =>
  c.fechaPasada ? 'La reserva ya se realizó: su fecha pasó' : null
const primero = (...fs: ((c: ContextoCambio) => string | null)[]) =>
  (c: ContextoCambio) => fs.map(f => f(c)).find(Boolean) ?? null

const PEDIDO: Record<string, Regla[]> = {
  pendiente: [{ destino: 'pagado' }, { destino: 'cancelado' }],
  // `pagado` a mano: pagó por fuera (transferencia, Nequi) sin terminar en la pasarela.
  pendiente_pago: [{ destino: 'pagado', bloqueo: enCurso }, { destino: 'cancelado', bloqueo: enCurso }],
  // Llegó aquí por algo de la pasarela que decide una persona; puede que ya se hubiera despachado.
  requiere_revision: [{ destino: 'pagado' }, { destino: 'enviado' }, { destino: 'entregado' }, { destino: 'cancelado' }],
  pagado: [{ destino: 'enviado' }, { destino: 'cancelado' }],
  enviado: [{ destino: 'entregado' }, { destino: 'pagado', tipo: 'correccion' }],
  entregado: [{ destino: 'enviado', tipo: 'correccion' }],
  cancelado: [],
  expirado: [],
}

const RESERVA: Record<string, Regla[]> = {
  pendiente: [{ destino: 'confirmada', bloqueo: fechaPasada }, { destino: 'cancelada' }],
  // `confirmada` a mano: pagó el abono por fuera de la pasarela.
  pendiente_pago: [
    { destino: 'confirmada', bloqueo: primero(enCurso, fechaPasada) },
    { destino: 'cancelada', bloqueo: enCurso },
  ],
  requiere_revision: [{ destino: 'confirmada', bloqueo: fechaPasada }, { destino: 'cancelada' }],
  confirmada: [{ destino: 'cancelada', bloqueo: yaRealizada }],
  cancelada: [],
  expirada: [],
}

const TABLAS = { pedido: PEDIDO, reserva: RESERVA }

export const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente', pendiente_pago: 'Esperando pago', requiere_revision: 'Revisar',
  pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado', expirado: 'Vencido',
  confirmada: 'Confirmada', cancelada: 'Cancelada', expirada: 'Vencida', realizada: 'Realizada',
}
const etiqueta = (e: string) => ETIQUETA_ESTADO[e] ?? e

export function opcionesEstado(tipo: 'pedido' | 'reserva', actual: string, c: ContextoCambio): OpcionEstado[] {
  return (TABLAS[tipo][actual] ?? []).map(r => ({
    destino: r.destino,
    tipo: r.tipo ?? 'avance',
    bloqueo: r.bloqueo?.(c) ?? null,
  }))
}

/** Nulo si el cambio se puede hacer; si no, el motivo para mostrarle a quien lo intentó. */
export function motivoRechazoCambio(
  tipo: 'pedido' | 'reserva', actual: string, destino: string, c: ContextoCambio,
): string | null {
  const opcion = opcionesEstado(tipo, actual, c).find(o => o.destino === destino)
  const quien = tipo === 'pedido' ? 'El pedido' : 'La reserva'
  if (!opcion) {
    return `${quien} está «${etiqueta(actual)}» y no puede pasar a «${etiqueta(destino)}»`
  }
  return opcion.bloqueo
}

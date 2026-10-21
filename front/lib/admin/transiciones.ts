import type { AdminPago, AdminPedido, AdminReserva } from './types'

/**
 * A qué estado puede pasar a mano un pedido o una reserva. Gemela de
 * back/src/common/transiciones-estado.ts, que es la que decide: si cambia una,
 * cambia la otra. Aquí sirve para que el panel ofrezca solo lo que el backend
 * va a aceptar, y explique lo que está bloqueado en vez de esconderlo.
 */

export interface ContextoCambio {
  pagoEnCurso: boolean
  fechaPasada: boolean
}

export interface OpcionEstado {
  destino: string
  tipo: 'avance' | 'correccion'
  bloqueo: string | null
}

type Regla = { destino: string; tipo?: 'correccion'; bloqueo?: (c: ContextoCambio) => string | null }

const PAGO_EN_CURSO = 'Hay un pago en curso con el banco. Espera a que se resuelva para no cobrar dos veces'
const enCurso = (c: ContextoCambio) => (c.pagoEnCurso ? PAGO_EN_CURSO : null)
const fechaYaPaso = (c: ContextoCambio) =>
  c.fechaPasada ? 'La fecha de la reserva ya pasó' : null
const yaRealizada = (c: ContextoCambio) =>
  c.fechaPasada ? 'La reserva ya se realizó: su fecha pasó' : null
const primero = (...fs: ((c: ContextoCambio) => string | null)[]) =>
  (c: ContextoCambio) => fs.map(f => f(c)).find(Boolean) ?? null

const PEDIDO: Record<string, Regla[]> = {
  pendiente: [{ destino: 'pagado' }, { destino: 'cancelado' }],
  pendiente_pago: [{ destino: 'pagado', bloqueo: enCurso }, { destino: 'cancelado', bloqueo: enCurso }],
  requiere_revision: [{ destino: 'pagado' }, { destino: 'enviado' }, { destino: 'entregado' }, { destino: 'cancelado' }],
  pagado: [{ destino: 'enviado' }, { destino: 'cancelado' }],
  enviado: [{ destino: 'entregado' }, { destino: 'pagado', tipo: 'correccion' }],
  entregado: [{ destino: 'enviado', tipo: 'correccion' }],
  cancelado: [],
  expirado: [],
}

const RESERVA: Record<string, Regla[]> = {
  pendiente: [{ destino: 'confirmada', bloqueo: fechaYaPaso }, { destino: 'cancelada' }],
  pendiente_pago: [
    { destino: 'confirmada', bloqueo: primero(enCurso, fechaYaPaso) },
    { destino: 'cancelada', bloqueo: enCurso },
  ],
  requiere_revision: [{ destino: 'confirmada', bloqueo: fechaYaPaso }, { destino: 'cancelada' }],
  confirmada: [{ destino: 'cancelada', bloqueo: yaRealizada }],
  cancelada: [],
  expirada: [],
}

export const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'Pendiente', pendiente_pago: 'Esperando pago', requiere_revision: 'Revisar',
  pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado', expirado: 'Vencido',
  confirmada: 'Confirmada', cancelada: 'Cancelada', expirada: 'Vencida', realizada: 'Realizada',
}

export function opcionesEstado(tipo: 'pedido' | 'reserva', actual: string, c: ContextoCambio): OpcionEstado[] {
  return ((tipo === 'pedido' ? PEDIDO : RESERVA)[actual] ?? []).map(r => ({
    destino: r.destino,
    tipo: r.tipo ?? 'avance',
    bloqueo: r.bloqueo?.(c) ?? null,
  }))
}

// ── Contexto ───────────────────────────────────────────────

/** Igual que HORAS_TOPE_PENDIENTE del backend: pasado esto el pago se da por perdido. */
const HORAS_TOPE_PENDIENTE = 24

/** Un pago que el banco tiene y no ha respondido. Gemela de `tienePagoEnCurso` (back/src/pagos/estados.ts). */
export function tienePagoEnCurso(pagos: AdminPago[] = [], ahora = new Date()): boolean {
  return pagos.some(p =>
    p.estado === 'pendiente' && p.proveedorTxId != null &&
    ahora.getTime() - new Date(p.createdAt).getTime() < HORAS_TOPE_PENDIENTE * 3_600_000,
  )
}

/** YYYY-MM-DD de hoy en Bogotá ('en-CA' formatea así). */
function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

/** La fecha de la reserva llega como medianoche UTC del día elegido. */
export const fechaPasada = (r: Pick<AdminReserva, 'fecha'>) => r.fecha.slice(0, 10) < hoyBogota()

export const contextoPedido = (p: AdminPedido): ContextoCambio =>
  ({ pagoEnCurso: tienePagoEnCurso(p.pagos), fechaPasada: false })

export const contextoReserva = (r: AdminReserva): ContextoCambio =>
  ({ pagoEnCurso: tienePagoEnCurso(r.pagos), fechaPasada: fechaPasada(r) })

/**
 * Una confirmada cuya fecha pasó ya se realizó. No se guarda: es un hecho del
 * calendario, y calcularlo evita un estado que alguien tendría que marcar.
 */
export const estaRealizada = (r: AdminReserva) => r.estado === 'confirmada' && fechaPasada(r)

/** El estado que se muestra: el guardado, o «realizada». */
export const estadoVisible = (r: AdminReserva) => (estaRealizada(r) ? 'realizada' : r.estado)

// ── Confirmaciones ─────────────────────────────────────────

/**
 * Lo que se le pregunta antes de un cambio delicado, o nulo si se aplica
 * directo. La cancelación de una reserva tiene su propio modal (pide el motivo
 * del correo) y no pasa por aquí.
 */
export function confirmacionPedido(actual: string, destino: string): { titulo: string; mensaje: string; boton: string } | null {
  if (destino === 'cancelado') {
    return {
      titulo: '¿Cancelar el pedido?',
      mensaje: 'Las unidades vuelven al inventario. Un pedido cancelado no se puede reabrir.',
      boton: 'Cancelar pedido',
    }
  }
  if (destino === 'pagado' && actual !== 'enviado') {
    return {
      titulo: '¿Marcar como pagado?',
      mensaje: actual === 'requiere_revision'
        ? 'Confirma que revisaste el cobro y el pago está bien.'
        : '¿Recibiste el pago por fuera de la pasarela (transferencia, Nequi…)? Solo márcalo si el dinero ya llegó.',
      boton: 'Sí, está pagado',
    }
  }
  const opcion = PEDIDO[actual]?.find(r => r.destino === destino)
  if (opcion?.tipo === 'correccion') {
    return {
      titulo: 'Corregir el estado',
      mensaje: `Vas a devolver el pedido de «${ETIQUETA_ESTADO[actual]}» a «${ETIQUETA_ESTADO[destino]}».`,
      boton: 'Corregir',
    }
  }
  return null
}

/** Volver al estado anterior se puede si ese regreso es una corrección de la tabla. */
export function sePuedeDeshacer(tipo: 'pedido' | 'reserva', desde: string, ahora: string): boolean {
  return opcionesEstado(tipo, ahora, { pagoEnCurso: false, fechaPasada: false })
    .some(o => o.destino === desde && o.tipo === 'correccion')
}

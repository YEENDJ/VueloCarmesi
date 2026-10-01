import type { AdminPago } from './types'

/**
 * Reglas del panel sobre el cobro en línea: qué cuenta en las cifras y qué
 * necesita a una persona. Viven aquí y no en cada página para que el
 * Overview, Pedidos y Reservas digan lo mismo.
 */

type ConPagos = { estado: string; pagos?: AdminPago[] }

/**
 * De prueba: tiene intentos de pago y todos son del sandbox. La base es una
 * sola, así que sin esto un pedido de prueba se ve y se suma como uno real.
 * Un pedido sin pagos es del flujo manual, y ese sí es real.
 */
export function esDePrueba(r: ConPagos): boolean {
  return !!r.pagos?.length && r.pagos.every(p => p.modo === 'prueba')
}

/**
 * Lo que nunca llegó a ser una venta: esperó pago y no lo tuvo, o sigue
 * esperándolo. Un carrito abandonado en la pasarela no es un pedido del mes.
 */
const SIN_VENTA = new Set(['pendiente_pago', 'expirado', 'expirada'])

/** Si entra en los conteos del Overview («Pedidos del mes», «Reservas del mes»). */
export function cuentaEnCifras(r: ConPagos): boolean {
  return !SIN_VENTA.has(r.estado) && !esDePrueba(r)
}

/** Si su total entra en «Ingresos estimados». Un cancelado no es ingreso. */
export function cuentaEnIngresos(r: ConPagos): boolean {
  return cuentaEnCifras(r) && r.estado !== 'cancelado' && r.estado !== 'cancelada'
}

/**
 * Si ya entró dinero por la pasarela. Una reserva con el abono pagado sigue en
 * `pendiente` —espera que la finca la confirme, como en el flujo manual—, y
 * sin esta marca en la lista no se distingue de una que nadie ha pagado.
 */
export function tienePagoAprobado(r: ConPagos): boolean {
  return !!r.pagos?.some(p => p.estado === 'aprobado')
}

/** La bandeja de lo que necesita a una persona: dinero de por medio y algo que decidir. */
export function requiereRevision(r: ConPagos): boolean {
  return r.estado === 'requiere_revision'
}

/**
 * El método tal como lo reporta la pasarela, en palabras del panel. Si llega
 * uno que no está aquí se muestra tal cual: mejor eso que ocultarlo.
 */
const METODOS: Record<string, string> = {
  tarjeta: 'Tarjeta',
  card: 'Tarjeta',
  pse: 'PSE',
  nequi: 'Nequi',
  bancolombia: 'Botón Bancolombia',
  bancolombia_transfer: 'Botón Bancolombia',
}

export function nombreMetodo(metodo: string | null): string {
  if (!metodo) return '—'
  return METODOS[metodo.toLowerCase()] ?? metodo
}

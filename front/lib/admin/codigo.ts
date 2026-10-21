/**
 * El código corto de un pedido o una reserva: `VC-AB12CD`. Es el mismo que el
 * cliente ve en sus correos y en «mi pedido» / «mi reserva», así que es el que
 * cita por WhatsApp. Gemelo de codigoPedido en back/src/pedidos/consulta.util.ts:
 * si cambia allá, cambia aquí.
 */
export function codigoCorto(id: string): string {
  return `VC-${id.slice(-6).toUpperCase()}`
}

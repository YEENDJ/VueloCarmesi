/**
 * Los intentos de pago tal como los ve el panel: del más reciente al más
 * viejo y sin `payload`, que es el evento crudo de la pasarela (pesado, y solo
 * sirve para auditar un reclamo directo en la base).
 */
export const PAGOS_PANEL = {
  orderBy: { createdAt: 'desc' as const },
  select: {
    id: true, referencia: true, monto: true, estado: true, metodo: true,
    motivo: true, modo: true, proveedor: true, createdAt: true,
  },
}

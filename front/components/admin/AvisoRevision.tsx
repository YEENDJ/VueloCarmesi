/**
 * Cabecera del detalle de un pedido o reserva en `requiere_revision`. Dice qué
 * pasó y qué se espera de quien lo abre, porque el estado solo no lo dice: el
 * motivo exacto llegó por Telegram y correo, y aquí se ven los intentos.
 */
export default function AvisoRevision({ tipo }: { tipo: 'pedido' | 'reserva' }) {
  return (
    <div
      role="note"
      style={{
        marginBottom: 16, padding: '12px 14px', borderRadius: 8,
        background: 'var(--status-revision-bg)', color: 'var(--status-revision-txt)',
        fontSize: 13, lineHeight: 1.5,
      }}
    >
      <strong>Necesita una persona.</strong> Hay un pago de por medio que no se pudo aplicar solo
      (llegó tarde sin stock, cobro doble, monto distinto o una anulación). El motivo llegó por
      Telegram y correo; abajo están los intentos. Contacta al cliente y, según lo que acuerden,
      {tipo === 'pedido'
        ? ' marca el pedido como pagado o cancélalo (el reembolso se hace desde la pasarela).'
        : ' confirma la reserva o cancélala (el reembolso se hace desde la pasarela).'}
    </div>
  )
}

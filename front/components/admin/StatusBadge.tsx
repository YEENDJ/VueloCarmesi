type Estado = string

const CONFIG: Record<string, { bg: string; txt: string; label: string }> = {
  pendiente:   { bg: 'var(--status-pendiente-bg)',  txt: 'var(--status-pendiente-txt)',  label: 'Pendiente' },
  confirmada:  { bg: 'var(--status-confirmada-bg)', txt: 'var(--status-confirmada-txt)', label: 'Confirmada' },
  cancelada:   { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Cancelada' },
  enviado:     { bg: 'var(--status-enviado-bg)',    txt: 'var(--status-enviado-txt)',    label: 'Enviado' },
  entregado:   { bg: 'var(--status-entregado-bg)',  txt: 'var(--status-entregado-txt)',  label: 'Entregado' },
  activa:      { bg: 'var(--status-activa-bg)',     txt: 'var(--status-activa-txt)',     label: 'Activa' },
  archivada:   { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Archivada' },
  // Solicitudes de grupo. «Nueva» en ámbar como «pendiente»: es la que espera
  // que alguien de la finca haga algo.
  nueva:       { bg: 'var(--status-pendiente-bg)',  txt: 'var(--status-pendiente-txt)',  label: 'Nueva' },
  contactada:  { bg: 'var(--status-enviado-bg)',    txt: 'var(--status-enviado-txt)',    label: 'Contactada' },
  cotizada:    { bg: 'var(--status-cotizada-bg)',   txt: 'var(--status-cotizada-txt)',   label: 'Cotizada' },
  cerrada:     { bg: 'var(--status-confirmada-bg)', txt: 'var(--status-confirmada-txt)', label: 'Cerrada' },
  perdida:     { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Perdida' },
}

export default function StatusBadge({ estado }: { estado: Estado }) {
  const cfg = CONFIG[estado] ?? { bg: 'var(--admin-bg)', txt: 'var(--admin-text-muted)', label: estado }
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 100,
      background: cfg.bg,
      color: cfg.txt,
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

type Estado = string

const CONFIG: Record<string, { bg: string; txt: string; label: string }> = {
  pendiente:   { bg: 'var(--status-pendiente-bg)',  txt: 'var(--status-pendiente-txt)',  label: 'Pendiente' },
  confirmada:  { bg: 'var(--status-confirmada-bg)', txt: 'var(--status-confirmada-txt)', label: 'Confirmada' },
  cancelada:   { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Cancelada' },
  enviado:     { bg: 'var(--status-enviado-bg)',    txt: 'var(--status-enviado-txt)',    label: 'Enviado' },
  entregado:   { bg: 'var(--status-entregado-bg)',  txt: 'var(--status-entregado-txt)',  label: 'Entregado' },
  activa:      { bg: 'var(--status-activa-bg)',     txt: 'var(--status-activa-txt)',     label: 'Activa' },
  archivada:   { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Archivada' },
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
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

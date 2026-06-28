export default function StatCard({
  label, value, icon, delta, alerta,
}: {
  label: string
  value: string | number
  icon: string
  delta?: string
  alerta?: boolean
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '22px 24px',
      boxShadow: '0 2px 8px rgba(135,43,19,.06)',
      border: alerta ? '1.5px solid rgba(245,156,0,.5)' : '1.5px solid transparent',
      flex: 1, minWidth: 180,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--admin-text-muted)' }}>
          {label}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: alerta ? 'rgba(245,156,0,.15)' : 'rgba(213,19,18,.08)', fontSize: 16,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: 34, fontWeight: 700, lineHeight: 1,
        color: alerta ? '#B45309' : 'var(--color-brown)',
      }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginTop: 8 }}>
          {delta}
        </div>
      )}
    </div>
  )
}

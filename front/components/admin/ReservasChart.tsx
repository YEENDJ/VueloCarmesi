'use client'

type Barra = { semana: string; cantidad: number }

export default function ReservasChart({ data }: { data: Barra[] }) {
  const max = Math.max(...data.map(d => d.cantidad), 1)

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '24px',
      boxShadow: '0 2px 8px rgba(135,43,19,.06)',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Reservas por semana</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)' }}>{d.cantidad}</div>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(to top, #D51312, #EA5B0C)',
              height: `${Math.max((d.cantidad / max) * 100, 4)}%`,
            }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{d.semana}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

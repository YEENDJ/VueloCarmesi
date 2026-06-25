export default function AdminOverviewPage() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Overview</div>
          <div className="admin-page-subtitle">Resumen del mes</div>
        </div>
      </div>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando métricas…</p>
    </div>
  )
}

export default function ConfigPage() {
  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Configuración</div>
          <div className="admin-page-subtitle">Ajustes generales de la finca</div>
        </div>
      </div>

      <div style={{
        background: '#fff', borderRadius: 14, padding: '48px',
        boxShadow: '0 2px 8px rgba(135,43,19,.06)',
        textAlign: 'center', maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Próximamente</div>
        <div style={{ fontSize: 14, color: 'var(--admin-text-muted)', lineHeight: 1.6 }}>
          Esta sección permitirá configurar los datos del sitio: nombre de la finca, email de contacto,
          teléfono y redes sociales (Instagram, WhatsApp).
        </div>
      </div>
    </>
  )
}

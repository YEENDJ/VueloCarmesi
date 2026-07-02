'use client'
import { usePathname, useRouter } from 'next/navigation'

const BREADCRUMBS: Record<string, string> = {
  '/admin':               'Overview',
  '/admin/reservas':      'Reservas',
  '/admin/experiencias':  'Experiencias',
  '/admin/productos':     'Productos',
  '/admin/pedidos':       'Pedidos',
  '/admin/config':        'Configuración',
}

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const section = BREADCRUMBS[pathname] ?? ''

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <header className="admin-header">
      <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 700 }}>
        Admin <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--color-brown)' }}>{section}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-muted)' }}>Admin</div>
        <button
          onClick={handleLogout}
          style={{
            padding: '7px 14px', borderRadius: 6, border: '1.5px solid var(--admin-border)',
            background: 'transparent', cursor: 'pointer', fontSize: 12,
            fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--admin-text-muted)',
          }}
        >
          Salir
        </button>
      </div>
    </header>
  )
}

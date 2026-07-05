'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin',              label: 'Overview',      icon: '📊' },
  { href: '/admin/reservas',     label: 'Reservas',      icon: '📅' },
  { href: '/admin/experiencias', label: 'Experiencias',  icon: '🌿' },
  { href: '/admin/productos',    label: 'Productos',     icon: '🍫' },
  { href: '/admin/pedidos',      label: 'Pedidos',       icon: '📦' },
  { href: '/admin/config',       label: 'Configuración', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,234,202,.12)' }}>
        {/* <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-gold)', lineHeight: 1.1 }}>
          Vuelo Carmesí
        </div> */}

        <Link href="/admin" style={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src="/images/logo.png"
          alt="Vuelo Carmesí"
          width={220}
          height={30}
          priority
        />
      </Link>
        <div style={{ fontSize: 11, color: 'rgba(255,234,202,.55)', marginTop: 4, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}>
          Panel de administración
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12 }}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item${isActive(item.href) ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User card */}
      <div style={{
        padding: '16px 20px', borderTop: '1px solid rgba(255,234,202,.12)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--color-crimson)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
        }}>A</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-cream)' }}>Admin</div>
          <div style={{ fontSize: 11, color: 'rgba(255,234,202,.6)' }}>Vuelo Carmesí</div>
        </div>
      </div>
    </aside>
  )
}

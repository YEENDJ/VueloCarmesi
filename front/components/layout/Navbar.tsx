import Link from 'next/link'
import Image from 'next/image'
import CartBadge from '@/components/shop/CartBadge'

export default function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: 'var(--color-crimson)',
      color: 'var(--color-cream)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src="/images/logo.png"
          alt="Vuelo Carmesí"
          width={250}
          height={40}
          priority
        />
      </Link>
      <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none' }}>
        <li><Link href="/" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Inicio</Link></li>
        <li><Link href="/experiencias" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Experiencias</Link></li>
        <li><Link href="/tienda" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Tienda</Link></li>
        <li><Link href="/contacto" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Contacto</Link></li>
        <li><CartBadge /></li>
      </ul>
    </nav>
  )
}

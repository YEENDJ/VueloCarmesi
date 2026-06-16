import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav style={{
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
          width={160}
          height={60}
          style={{ objectFit: 'contain' }}
          priority
        />
      </Link>
      <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none' }}>
        <li><Link href="/experiencias" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Experiencias</Link></li>
        <li><Link href="/tienda" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Tienda</Link></li>
        <li><Link href="/contacto" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Contacto</Link></li>
      </ul>
    </nav>
  )
}

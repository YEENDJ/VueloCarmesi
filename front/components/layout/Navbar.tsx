import Link from 'next/link'

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
      <Link href="/" style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        color: 'var(--color-cream)',
        textDecoration: 'none',
      }}>
        Vuelo Carmesí
      </Link>
      <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none' }}>
        <li><Link href="/experiencias" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Experiencias</Link></li>
        <li><Link href="/tienda" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Tienda</Link></li>
        <li><Link href="/contacto" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Contacto</Link></li>
      </ul>
    </nav>
  )
}

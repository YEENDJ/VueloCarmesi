import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-brown)', color: 'var(--color-cream)',
      padding: '3rem 2rem', marginTop: '4rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-gold)' }}>
            Vuelo Carmesí
          </h3>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Experiencias agroecológicas con sabor a cacao.</p>
        </div>
        <div>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-amber)' }}>Navegación</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[['Experiencias', '/experiencias'], ['Tienda', '/tienda'], ['Contacto', '/contacto']].map(([label, href]) => (
              <li key={href}><Link href={href} style={{ color: 'var(--color-cream)', opacity: 0.8, textDecoration: 'none' }}>{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-amber)' }}>Contacto</h4>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>hola@vuelocarmesi.com</p>
        </div>
      </div>
      <p style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.5, fontSize: '0.8rem' }}>
        © {new Date().getFullYear()} Vuelo Carmesí. Todos los derechos reservados.
      </p>
    </footer>
  )
}

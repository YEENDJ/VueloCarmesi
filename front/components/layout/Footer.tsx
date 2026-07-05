import Link from 'next/link'
import CertBadge from '@/components/secciones/CertBadge'
import { CERTIFICACIONES } from '@/lib/certificaciones'

const SOCIAL = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/vuelo_carmesi?igsh=MWUxdjc1djRyc2Y2OQ==',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1D4zy8b9HB/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/+573115800975',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@vuelo_carmesi?_r=1&_t=ZS-97S50KhhcwC',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.2 8.2 0 0 0 4.79 1.52V6.78a4.86 4.86 0 0 1-1.02-.09z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-brown)',
      color: 'var(--color-cream)',
      padding: 'clamp(48px, 7vw, 64px) clamp(16px, 3vw, 32px) 24px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>

        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', marginBottom: '12px', color: 'var(--color-cream)' }}>
            Vuelo Carmesí
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255, 234, 202, 0.8)', maxWidth: '30ch' }}>
            Experiencias agroecológicas con sabor a cacao.
          </p>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '14px' }}>
            Navegación
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {([['Experiencias', '/experiencias'], ['Tienda', '/tienda'], ['Sobre nosotros', '/sobre-nosotros'], ['Contacto', '/contacto']] as [string, string][]).map(([label, href]) => (
              <li key={href}>
                <Link href={href} style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255, 234, 202, 0.85)', textDecoration: 'none' }}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '14px' }}>
            Contacto
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontWeight: 700, fontSize: '14px', color: 'rgba(255, 234, 202, 0.85)' }}>
            <span>carmesivuelo@gmail.com</span>
            <span>+57 311 580 0975</span>
            <span>Finca La Fortuna, Vereda Brisas del Tonoa, Cubarral, Meta, Colombia</span>
          </div>

          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', margin: '24px 0 14px' }}>
            Redes
          </div>
          <div className="footer-social" style={{ display: 'flex', gap: '16px' }}>
            {SOCIAL.map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                {icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '14px' }}>
            Certificados por
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            {CERTIFICACIONES.map((cert) => (
              <CertBadge key={cert.nombre} cert={cert} variant="footer" />
            ))}
          </div>
        </div>

      </div>

      <div style={{ borderTop: '1px solid rgba(253, 195, 0, 0.3)', marginTop: '32px', paddingTop: '24px', textAlign: 'center', fontWeight: 700, fontSize: '12px', color: 'rgba(255, 234, 202, 0.6)' }}>
        © {new Date().getFullYear()} Vuelo Carmesí. Todos los derechos reservados.
      </div>
    </footer>
  )
}

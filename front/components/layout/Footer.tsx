import Link from 'next/link'
import Image from 'next/image'
import TiraConfianza from '@/components/layout/TiraConfianza'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'

// Crédito de desarrollo mostrado en la barra legal del footer
const AGENCIA = { nombre: 'XyraCode', url: 'https://Xyracode.com' }

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
    icon: <IconoWhatsapp />,
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
      /* Solo vertical: el lateral y el ancho los pone .contenido, para que la
         franja brown siga llegando a los bordes de la pantalla. */
      paddingBlock: 'clamp(48px, 7vw, 64px) 24px',
    }}>
      <div className="contenido">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '2.5rem' }}>

        <div>
          {/* El logotipo en vez del nombre escrito. Va la variante crema, que es
              la que se lee sobre el brown del footer; la crimson desaparecería.
              El alt conserva el texto para lectores de pantalla y para cuando la
              imagen no cargue, así que la marca no se pierde en ningún caso. */}
          <Image
            src="/images/marca/logo-crema.png"
            alt="Vuelo Carmesí"
            width={220}
            height={35}
            sizes="220px"
            style={{ width: 'min(220px, 100%)', height: 'auto', display: 'block', marginBottom: '12px' }}
          />
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255, 234, 202, 0.8)', maxWidth: '30ch' }}>
            Experiencias agroecológicas con sabor a cacao.
          </p>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '14px' }}>
            Navegación
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {([['Experiencias', '/experiencias'], ['Tienda', '/tienda'], ['Sobre nosotros', '/sobre-nosotros'], ['Contacto', '/contacto'], ['Cancelaciones', '/politicas/cancelacion']] as [string, string][]).map(([label, href]) => (
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

      </div>

      {/* Los cuatro avales van a lo ancho, no apretados en una columna: es la
          tira de confianza de la marca y se lee igual que en el portafolio. */}
      <TiraConfianza />

      <div className="footer-legal" style={{ marginTop: '24px', paddingTop: '20px', fontWeight: 700, fontSize: '12px', color: 'rgba(255, 234, 202, 0.6)' }}>
        <span>© {new Date().getFullYear()} Vuelo Carmesí. Todos los derechos reservados.</span>
        <span>
          Desarrollado por{' '}
          <a href={AGENCIA.url} target="_blank" rel="noopener noreferrer" className="footer-credito">
            {AGENCIA.nombre}
          </a>
        </span>
      </div>
      </div>
    </footer>
  )
}

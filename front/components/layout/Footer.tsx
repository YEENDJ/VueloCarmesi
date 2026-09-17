import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import TiraConfianza from '@/components/layout/TiraConfianza'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'
import { IconoInstagram, IconoFacebook, IconoTiktok } from '@/components/ui/IconosRedes'
import { CONTACTO, MENSAJE_WHATSAPP, REDES, whatsappCon } from '@/lib/contacto'

// Crédito de desarrollo mostrado en la barra legal del footer
const AGENCIA = { nombre: 'XyraCode', url: 'https://Xyracode.com' }

const SOCIAL = [
  { label: 'Instagram', href: REDES.instagram, icon: <IconoInstagram /> },
  { label: 'Facebook', href: REDES.facebook, icon: <IconoFacebook /> },
  { label: 'WhatsApp', href: whatsappCon(MENSAJE_WHATSAPP.general), icon: <IconoWhatsapp /> },
  { label: 'TikTok', href: REDES.tiktok, icon: <IconoTiktok /> },
]

export default function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

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
            {t('lema')}
          </p>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '14px' }}>
            {t('navegacion')}
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Aviturismo va en el pie y no en la navbar porque no es una sexta
                pestaña del sitio: es la puerta de entrada de un público que
                llega buscando «birding Meta Colombia», no navegando desde la
                home. Lo que necesita es existir como enlace en todas las
                páginas para que el buscador la alcance sin depender de una
                sola ruta. */}
            {([['experiencias', '/experiencias'], ['aviturismo', '/aviturismo'], ['tienda', '/tienda'], ['nosotros', '/sobre-nosotros'], ['contacto', '/contacto'], ['politicas', '/politicas']] as const).map(([clave, href]) => (
              <li key={href}>
                <Link href={href} style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255, 234, 202, 0.85)', textDecoration: 'none' }}>
                  {tNav(clave)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '14px' }}>
            {t('contacto')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontWeight: 700, fontSize: '14px', color: 'rgba(255, 234, 202, 0.85)' }}>
            <span>{CONTACTO.email}</span>
            <span>{CONTACTO.telefono}</span>
            <span>{CONTACTO.direccionCompleta}</span>
          </div>

          <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gold)', margin: '24px 0 14px' }}>
            {t('redes')}
          </div>
          <div className="footer-social">
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
        <span>{t('derechos', { anio: new Date().getFullYear() })}</span>
        <span>
          {t('desarrolladoPor')}{' '}
          <a href={AGENCIA.url} target="_blank" rel="noopener noreferrer" className="footer-credito">
            {AGENCIA.nombre}
          </a>
        </span>
      </div>
      </div>
    </footer>
  )
}

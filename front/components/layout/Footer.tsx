import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import TiraConfianza from '@/components/layout/TiraConfianza'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'
import { IconoInstagram, IconoFacebook, IconoTiktok } from '@/components/ui/IconosRedes'
import { CONTACTO, REDES, whatsappCon } from '@/lib/contacto'

// Crédito de desarrollo mostrado en la barra legal del footer
const AGENCIA = { nombre: 'XyraCode', url: 'https://Xyracode.com' }

export default function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const tw = useTranslations('whatsapp')

  // Dentro del componente y no a nivel de módulo: el mensaje de WhatsApp sale
  // del catálogo y necesita el idioma de la página.
  const SOCIAL = [
    { label: 'Instagram', href: REDES.instagram, icon: <IconoInstagram /> },
    { label: 'Facebook', href: REDES.facebook, icon: <IconoFacebook /> },
    { label: 'WhatsApp', href: whatsappCon(tw('general')), icon: <IconoWhatsapp /> },
    { label: 'TikTok', href: REDES.tiktok, icon: <IconoTiktok /> },
  ]

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
          {/* Dos columnas: con siete enlaces, una sola dejaba esta columna casi
              el doble de alta que sus vecinas y descuadraba la fila del pie.

              `minmax(0, 1fr)` y no `1fr` a secas: una pista de 1fr no baja del
              ancho de su contenido —«Experiencias» es la más larga— y en
              pantalla angosta desbordaría en vez de encoger. */}
          <ul style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            // 12px de canal y no 16: el punto justo es cuando el footer está en
            // tres columnas de 200px —viewport ~744px—, donde cada columna
            // interna queda en 94px y «Experiencias», que es la etiqueta más
            // larga, mide casi eso. Con 16px se partía en dos líneas.
            gap: '10px 12px',
          }}>
            {/* Aviturismo y Grupos viven en el pie y no en la navbar: ninguno
                es una pestaña más del sitio. Son las puertas de entrada de dos
                públicos que llegan buscando —«birding Meta Colombia», «salida
                pedagógica Meta»— y no navegando desde la home. Lo que necesitan
                es existir como enlace en todas las páginas para que el buscador
                las alcance sin depender de una sola ruta; a los visitantes que
                ya están dentro los recogen los avisos de /contacto,
                /experiencias y el formulario de reserva. */}
            {([['experiencias', '/experiencias'], ['grupos', '/grupos'], ['aviturismo', '/aviturismo'], ['tienda', '/tienda'], ['nosotros', '/sobre-nosotros'], ['contacto', '/contacto'], ['politicas', '/politicas']] as const).map(([clave, href]) => (
              <li key={href} style={{ minWidth: 0 }}>
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

      {/* El art. 50 de la Ley 1480, modificado por la Ley 2439 de 2024, exige a
          quien vende en línea un enlace visible a la Superintendencia. Va en el
          pie para que esté en todas las páginas de la tienda. El logo es
          opcional; el nombre no se traduce porque es la entidad.
          El aviso de ESCNNA no va aquí: está en las páginas donde se ofrecen
          los servicios, ver components/legal/AvisoEscnna.tsx. */}
      <div className="footer-avisos">
        <p>
          {t.rich('sic', {
            enlace: (texto) => (
              <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="footer-aviso-enlace">
                {texto}
              </a>
            ),
          })}
        </p>
      </div>

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

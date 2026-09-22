import Image from 'next/image'
import type { Certificacion } from '@/lib/certificaciones'
import { useTranslations } from 'next-intl'

interface Props {
  cert: Certificacion
  variant?: 'card' | 'footer'
}

/**
 * Símbolo ® dibujado en curva: no hay archivo que cargar y toma el color del
 * contexto, así que sirve igual sobre crema y sobre brown. Mismo trazado que
 * `public/certificaciones/RegisteredTM.svg` y que la hoja 15 del portafolio.
 */
function SimboloRegistrado({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Marca registrada"
      className={className}
      style={size ? { width: size, height: size, flexShrink: 0 } : { flexShrink: 0 }}
    >
      <circle cx="100" cy="100" r="88.5" fill="none" stroke="currentColor" strokeWidth="20" />
      <path
        fill="currentColor"
        d="M94.6 92C100.1 92 104.1 90.9 106.5 88.8C108.9 86.8 110.2 83.4 110.2 78.6C110.2 73.9 108.9 70.6 106.5 68.5C104.1 66.5 100.1 65.5 94.6 65.5L83.4 65.5L83.4 92L94.6 92M83.4 110.3L83.4 149.3L56.8 149.3L56.8 46.2L97.4 46.2C111 46.2 120.9 48.5 127.2 53.1C133.6 57.6 136.7 64.8 136.7 74.7C136.7 81.5 135.1 87.1 131.8 91.5C128.5 95.8 123.6 99.1 116.9 101.1C120.6 102 123.8 103.9 126.7 106.8C129.6 109.7 132.5 114.1 135.4 120.1L149.9 149.3L121.6 149.3L109 123.7C106.5 118.6 103.9 115 101.3 113.2C98.7 111.3 95.2 110.3 90.9 110.3L83.4 110.3"
      />
    </svg>
  )
}

export default function CertBadge({ cert, variant = 'card' }: Props) {
  const ta = useTranslations('avales')

  const isCard = variant === 'card'
  const logo = !isCard && cert.logoOscuro ? cert.logoOscuro : cert.logo

  // En el footer el tamaño lo fija `.tira-confianza` con --cert-size, para que
  // los cuatro avales escalen juntos entre móvil y escritorio.
  if (cert.forma === 'simbolo') {
    // Va desnudo, sin círculo: el propio ® ya es un anillo y encerrarlo en otro
    // lo convierte en una diana. Igual que en la hoja 15 del portafolio.
    return isCard
      ? <SimboloRegistrado size={68} className="cert-simbolo-card" />
      : <SimboloRegistrado className="cert-simbolo-footer" />
  }

  // El tipo declara `logo` opcional —los avales de forma `simbolo` no tienen
  // archivo— y esa rama ya salió arriba. Lo que quede sin logo no se pinta:
  // hasta ahora daba un <img> roto, y `next/image` no admite `src` indefinido.
  if (!logo) return null

  if (cert.forma === 'sello-rectangular') {
    // Sellos con zona de respeto (p. ej. Calidad Turística Colombia): su manual
    // prohíbe recortarlos, así que van completos y sin círculo. La versión
    // horizontal a estas alturas queda por encima del mínimo digital de 141px.
    return (
      // `next/image` y no un <img>: ctc.png son 900×365 y 65 KB para pintarse
      // a 96px de alto en la tarjeta y a 46-60 en el pie. Y el pie va en
      // todas las páginas. Al vivir en `public/` los optimiza el despliegue
      // sin `remotePatterns`. El tamaño real lo siguen fijando el CSS y
      // `style`; `width`/`height` solo dan la proporción del archivo.
      <Image
        src={logo}
        alt={ta('selloAlt', { nombre: ta(`${cert.clave}.nombre`) })}
        title={ta(`${cert.clave}.nombre`)}
        width={cert.ancho ?? 900}
        height={cert.alto ?? 365}
        sizes="240px"
        className={isCard ? undefined : 'cert-sello-footer'}
        style={{
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          width: 'auto',
          ...(isCard ? { height: 96 } : undefined),
        }}
      />
    )
  }

  return (
    <div
      className={isCard ? undefined : 'cert-badge-footer'}
      title={ta(`${cert.clave}.nombre`)}
      style={{
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        ...(isCard
          ? { width: 96, height: 96, border: '2px solid rgba(135,43,19,.12)', backgroundColor: '#FFF6E4' }
          : undefined),
      }}
    >
      {/* 96px en la tarjeta, --cert-size (46-60) en el pie. bpa.png son
          554×554 y 82 KB para eso. El contenedor le fija el tamaño; las
          medidas son las del archivo, que no es cuadrado en los dos casos. */}
      <Image
        src={logo}
        alt={ta('logoAlt', { entidad: ta(`${cert.clave}.entidad`) })}
        width={cert.ancho ?? 96}
        height={cert.alto ?? 96}
        sizes="96px"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}

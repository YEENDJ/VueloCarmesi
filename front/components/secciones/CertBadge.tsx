import type { Certificacion } from '@/lib/certificaciones'

interface Props {
  cert: Certificacion
  variant?: 'card' | 'footer'
}

export default function CertBadge({ cert, variant = 'card' }: Props) {
  const isCard = variant === 'card'
  const size = isCard ? 96 : 64
  const logo = !isCard && cert.logoOscuro ? cert.logoOscuro : cert.logo

  // Sellos con zona de respeto (p. ej. Calidad Turística Colombia): su manual
  // prohíbe recortarlos, así que van completos y sin círculo. La versión
  // horizontal a estas alturas queda por encima del mínimo digital de 141px.
  if (cert.forma === 'sello-rectangular') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`Sello ${cert.nombre}`}
        title={cert.nombre}
        style={{ height: size, maxWidth: '100%', objectFit: 'contain', display: 'block', flexShrink: 0 }}
      />
    )
  }

  return (
    <div
      className={isCard ? undefined : 'cert-badge-footer'}
      title={cert.nombre}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        ...(isCard
          ? { border: '2px solid rgba(135,43,19,.12)', backgroundColor: '#FFF6E4' }
          : undefined),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={`Logo ${cert.entidad}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}

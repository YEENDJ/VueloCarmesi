import type { Experiencia } from '@/lib/types'
import { useTranslations, useLocale } from 'next-intl'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'

interface ExperienciaCardProps {
  experiencia: Experiencia
  /**
   * En la landing la vitrina ya está filtrada a destacadas, así que el badge
   * se repetiría en las tres tarjetas sin distinguir nada. En el catálogo
   * completo sí informa, y por eso viene encendido por defecto.
   */
  mostrarBadgeDestacada?: boolean
}

export default function ExperienciaCard({
  experiencia,
  mostrarBadgeDestacada = true,
}: ExperienciaCardProps) {
  const idioma = useLocale()

  const t = useTranslations('reserva')

  return (
    <Card>
      {/* aspect-ratio en vez de alto fijo: el marco crece con la columna del grid
          y reserva el espacio antes de que cargue la foto, así la tarjeta no salta. */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        width: '100%', aspectRatio: '4 / 3', backgroundColor: 'var(--color-amber)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {experiencia.imagen
          ? <img src={experiencia.imagen} alt={experiencia.nombre}
                 style={{ width: '100%', height: '100%', maxWidth: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}>🍫</span>
        }

        {/* La etiqueta "Destacada" vive sobre la foto, arriba a la derecha:
            equilibra la duración que va abajo a la izquierda y se ve antes
            que el título. */}
        {mostrarBadgeDestacada && experiencia.destacada && (
          <span style={{
          position: 'absolute', top: '0.75rem', right: '0.9rem',
          color: 'var(--color-cream)',
          fontSize: '1.15rem', lineHeight: 1,
          textShadow: '0 1px 3px rgba(74, 23, 9, 0.6)',
        }}>★</span>
        )}

        {/* La duración va como etiqueta sobre la foto: un dato legible sin
            importar si la imagen de abajo es clara u oscura. El fondo
            semi-transparente y el borde ámbar la separan del contenido sin
            taparlo. */}
        <div style={{
          position: 'absolute', left: '0.9rem', bottom: '0.9rem',
          padding: '0.35rem 0.75rem',
          background: 'rgba(74, 23, 9, 0.55)',
          border: '1px solid transparent',
          borderRadius: '999px',
          color: 'var(--color-cream)',
          fontSize: '0.8rem', fontWeight: 700, lineHeight: 1,
          minWidth: 0, overflowWrap: 'anywhere',
        }}>
          {experiencia.duracion}
        </div>
      </div>
      <div style={{ padding: 'clamp(0.9rem, 3vw, 1.25rem)', minWidth: 0 }}>
        {/* overflowWrap parte un nombre largo sin espacios en vez de desbordar la tarjeta. */}
        <h3 style={{
          marginBottom: '0.5rem', color: 'var(--color-brown)', minWidth: 0,
          fontSize: 'clamp(1rem, 2.2vw, 1.08rem)', overflowWrap: 'anywhere',
        }}>
          {experiencia.nombre}
        </h3>
        {/* Sin descripción: la foto y el nombre venden, y textos de largo
            variable dejaban las tarjetas desparejas entre sí. El detalle vive
            en la ficha, que es donde hay sitio para contarlo. */}
        {/* wrap + gap: a 320px el precio y el botón se apilan en vez de aplastarse. */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <span style={{
            fontWeight: 700, color: 'var(--color-crimson)', minWidth: 0,
            fontSize: 'clamp(1rem, 2.5vw, 1.12rem)',
          }}>
            {formatPrecio(experiencia.precio, idioma)}
          </span>
          <Button href={`/experiencias/${experiencia.slug}`} variant="outline" className="btn-card">{t('verMas')}</Button>
        </div>
      </div>
    </Card>
  )
}

import type { Experiencia } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
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
  return (
    <Card>
      {/* aspect-ratio en vez de alto fijo: el marco crece con la columna del grid
          y reserva el espacio antes de que cargue la foto, así la tarjeta no salta. */}
      <div style={{
        width: '100%', aspectRatio: '4 / 3', backgroundColor: 'var(--color-amber)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {experiencia.imagen
          ? <img src={experiencia.imagen} alt={experiencia.nombre}
                 style={{ width: '100%', height: '100%', maxWidth: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}>🍫</span>
        }
      </div>
      <div style={{ padding: 'clamp(0.9rem, 3vw, 1.25rem)', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {mostrarBadgeDestacada && experiencia.destacada && <Badge color="crimson">Destacada</Badge>}
          <Badge color="amber">{experiencia.duracion}</Badge>
        </div>
        {/* overflowWrap parte un nombre largo sin espacios en vez de desbordar la tarjeta. */}
        <h3 style={{
          marginBottom: '0.5rem', color: 'var(--color-brown)', minWidth: 0,
          fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', overflowWrap: 'anywhere',
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
            {formatPrecio(experiencia.precio)}
          </span>
          <Button href={`/experiencias/${experiencia.slug}`} variant="outline">Ver más</Button>
        </div>
      </div>
    </Card>
  )
}

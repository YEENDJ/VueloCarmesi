import type { Experiencia } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function ExperienciaCard({ experiencia }: { experiencia: Experiencia }) {
  return (
    <Card>
      <div style={{ height: '220px', backgroundColor: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {experiencia.imagen
          ? <img src={experiencia.imagen} alt={experiencia.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '4rem' }}>🍫</span>
        }
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {experiencia.destacada && <Badge color="crimson">Destacada</Badge>}
          <Badge color="amber">{experiencia.duracion}</Badge>
        </div>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>{experiencia.nombre}</h3>
        <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.95rem', lineHeight: 1.6 }}>{experiencia.descripcion}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-crimson)' }}>
            ${experiencia.precio.toLocaleString('es-AR')}
          </span>
          <Button href={`/experiencias/${experiencia.slug}`} variant="outline">Ver más</Button>
        </div>
      </div>
    </Card>
  )
}

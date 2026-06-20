import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const experiencias = await getExperiencias()
  return experiencias.map(e => ({ slug: e.slug }))
}

export default async function ExperienciaDetallePage({ params }: { params: { slug: string } }) {
  const exp = await getExperienciaBySlug(params.slug)
  if (!exp) notFound()

  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
      <div style={{ height: '400px', backgroundColor: 'var(--color-amber)', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '6rem' }}>🍫</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {exp.destacada && <Badge color="crimson">Destacada</Badge>}
        <Badge color="amber">{exp.duracion}</Badge>
        <Badge color="orange">Hasta {exp.capacidad} personas</Badge>
      </div>
      <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>{exp.nombre}</h1>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2rem', opacity: 0.85 }}>{exp.descripcion}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-crimson)' }}>
          ${exp.precio.toLocaleString('es-AR')}
        </span>
        <Button href={`/reservar/${exp.slug}`}>Reservar ahora</Button>
      </div>
    </section>
  )
}

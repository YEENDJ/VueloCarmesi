import { getExperienciaBySlug } from '@/lib/api/experiencias'
import ReservaForm from '@/components/booking/ReservaForm'
import { notFound } from 'next/navigation'

export default async function ReservarPage({ params }: { params: { slug: string } }) {
  const exp = await getExperienciaBySlug(params.slug)
  if (!exp) notFound()

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Reservar: {exp.nombre}</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.7 }}>${exp.precio.toLocaleString('es-AR')} por persona · {exp.duracion}</p>
      <ReservaForm experiencia={exp} />
    </section>
  )
}

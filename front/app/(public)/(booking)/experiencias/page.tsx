import ExperienciaCard from '@/components/booking/ExperienciaCard'
import { getExperiencias } from '@/lib/api/experiencias'

export default async function ExperienciasPage() {
  const experiencias = await getExperiencias()

  return (
    <section className="page-shell" style={{ maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Nuestras Experiencias</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Viví el cacao desde adentro.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {experiencias.map(exp => <ExperienciaCard key={exp.id} experiencia={exp} />)}
      </div>
    </section>
  )
}

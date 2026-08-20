import ExperienciaCard from '@/components/booking/ExperienciaCard'
import { getExperiencias } from '@/lib/api/experiencias'

export const revalidate = 60

export default async function ExperienciasPage() {
  const experiencias = await getExperiencias()

  return (
    <section className="page-shell" style={{ maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Nuestras Experiencias</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Viví el cacao desde adentro.</p>
      {experiencias.length === 0 ? (
        <p
          style={{
            border: '1.5px dashed var(--color-gold)',
            borderRadius: '12px',
            padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 32px)',
            textAlign: 'center',
            color: 'var(--color-brown)',
            fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
            lineHeight: 1.7,
            opacity: 0.75,
            minWidth: 0,
          }}
        >
          Aún no hay experiencias disponibles. Vuelve pronto.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '2rem' }}>
          {experiencias.map(exp => <ExperienciaCard key={exp.id} experiencia={exp} />)}
        </div>
      )}
    </section>
  )
}

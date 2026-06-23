import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ImageGallery from '@/components/ui/ImageGallery'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const experiencias = await getExperiencias()
  return experiencias.map(e => ({ slug: e.slug }))
}

export default async function ExperienciaDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const exp = await getExperienciaBySlug(slug)
  if (!exp) notFound()

  const images = exp.images ?? []
  const heroImage = images[0] ?? ''
  const incluye = exp.incluye ?? []
  const queTraer = exp.queTraer ?? []

  return (
    <>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          height: 'clamp(300px, 40vw, 480px)',
          backgroundImage: heroImage ? `url(${heroImage})` : 'none',
          backgroundColor: 'var(--color-brown)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <h1
          style={{
            position: 'relative',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: 'var(--color-cream)',
            textAlign: 'center',
            padding: '0 2rem',
            lineHeight: 1.15,
          }}
        >
          {exp.nombre}
        </h1>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <Badge color="amber">Disponible</Badge>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        <div className="detail-grid-exp">
          {/* Left column — content */}
          <div>
            <h2 style={{ color: 'var(--color-crimson)', marginBottom: '16px' }}>
              Sobre esta experiencia
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'var(--color-brown)',
                marginBottom: '32px',
              }}
            >
              {exp.descripcion}
            </p>

            {incluye.length > 0 && (
              <>
                <h3 style={{ color: 'var(--color-brown)', marginBottom: '12px' }}>¿Qué incluye?</h3>
                <ul style={{ listStyle: 'none', marginBottom: '32px' }}>
                  {incluye.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                        color: 'var(--color-brown)',
                      }}
                    >
                      <span style={{ color: 'var(--color-amber)', fontWeight: 700, flexShrink: 0 }}>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {queTraer.length > 0 && (
              <>
                <h3 style={{ color: 'var(--color-brown)', marginBottom: '12px' }}>¿Qué traer?</h3>
                <ul style={{ listStyle: 'none', marginBottom: '32px' }}>
                  {queTraer.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                        color: 'var(--color-brown)',
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '32px' }} />

            <ImageGallery images={images} alt={exp.nombre} aspectRatio="4/3" />
          </div>

          {/* Right column — sticky sidebar */}
          <div>
            <div
              className="sidebar-sticky"
              style={{
                position: 'sticky',
                top: '88px',
                backgroundColor: 'var(--color-cream)',
                border: '1px solid rgba(135,43,19,0.1)',
                borderRadius: '12px',
                padding: '28px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--color-amber)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  ${exp.precio.toLocaleString('es-AR')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  marginBottom: '20px',
                  color: 'var(--color-brown)',
                  fontSize: '0.9rem',
                }}
              >
                <span>⏱ {exp.duracion}</span>
                <span>👥 {exp.capacidad} personas</span>
              </div>

              <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '20px' }} />

              <div style={{ marginBottom: '12px' }}>
                <Button
                  href={`/reservar/${exp.slug}`}
                  variant="primary"
                  style={{ display: 'block', textAlign: 'center', width: '100%' }}
                >
                  Reservar ahora
                </Button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--color-brown)', opacity: 0.6 }}>
                Sin compromiso · Cancelación flexible
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

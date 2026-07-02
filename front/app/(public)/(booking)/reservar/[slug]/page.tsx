import { getExperienciaBySlug } from '@/lib/api/experiencias'
import ReservaForm from '@/components/booking/ReservaForm'
import { notFound } from 'next/navigation'

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const exp = await getExperienciaBySlug(slug)
  if (!exp) notFound()

  const thumbnail = exp.images?.[0] ?? exp.imagen

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(40px,6vw,64px) 24px 80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 40px)',
              color: 'var(--color-crimson)',
              marginBottom: '8px',
              lineHeight: 1.15,
            }}
          >
            Reservá tu experiencia
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--color-brown)',
              opacity: 0.7,
            }}
          >
            Completá el formulario y nos comunicamos para confirmar tu lugar.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="reserva-grid">

          {/* Left — form card */}
          <div>
            <div
              style={{
                backgroundColor: '#FFF6E4',
                borderRadius: '12px',
                padding: 'clamp(24px, 4vw, 40px)',
                boxShadow: '0 4px 16px rgba(135,43,19,.16)',
              }}
            >
              <ReservaForm experiencia={exp} />
            </div>
          </div>

          {/* Right — sticky summary */}
          <div className="reserva-summary">
            <div
              style={{
                position: 'sticky',
                top: '88px',
                backgroundColor: 'var(--color-brown)',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 4px 16px rgba(135,43,19,.20)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: 'var(--color-gold)',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Estás reservando
              </p>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  color: 'var(--color-cream)',
                  lineHeight: 1.2,
                  marginBottom: '16px',
                }}
              >
                {exp.nombre}
              </h2>

              {thumbnail && (
                <div
                  style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnail}
                    alt={exp.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-cream)' }}>
                  <span style={{ color: 'var(--color-amber)', fontWeight: 700 }}>
                    ${exp.precio.toLocaleString('es-AR')}
                  </span>
                  {' '}por persona
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-cream)' }}>
                  ⏱ {exp.duracion}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-cream)' }}>
                  👥 Hasta {exp.capacidad} personas
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(253,195,0,.3)', paddingTop: '16px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(255,234,202,.6)',
                    lineHeight: 1.6,
                  }}
                >
                  Te contactaremos para confirmar disponibilidad. Sin compromiso de pago hasta la confirmación.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

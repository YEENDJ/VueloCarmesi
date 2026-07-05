import CertBadge from '@/components/secciones/CertBadge'
import { CERTIFICACIONES } from '@/lib/certificaciones'

export default function Certificaciones() {
  return (
    <section
      id="certificaciones"
      style={{
        backgroundColor: 'var(--color-cream)',
        padding: 'clamp(48px, 8vw, 80px) 24px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'var(--color-orange)',
              marginBottom: '16px',
            }}
          >
            Avales y certificaciones
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: 'var(--color-crimson)',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            Respaldados por quienes cuidan la tierra
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 'clamp(16px, 1.6vw, 18px)',
              color: 'rgba(135,43,19,.7)',
              lineHeight: 1.7,
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            Nuestras prácticas agroecológicas y turísticas están certificadas por
            organismos oficiales. Trabajamos con transparencia, del monte a tu mesa.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          {CERTIFICACIONES.map((cert) => (
            <div
              key={cert.nombre}
              style={{
                backgroundColor: '#FFF6E4',
                border: '1px solid rgba(135,43,19,.15)',
                borderRadius: '12px',
                padding: '28px 24px',
                boxShadow: '0 2px 8px rgba(135,43,19,.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <CertBadge cert={cert} />
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '17px',
                  color: 'var(--color-brown)',
                  marginTop: '20px',
                }}
              >
                {cert.nombre}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '.5px',
                  textTransform: 'uppercase',
                  color: 'var(--color-orange)',
                  margin: '6px 0 12px',
                }}
              >
                {cert.entidad}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'rgba(135,43,19,.7)',
                }}
              >
                {cert.detalle}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

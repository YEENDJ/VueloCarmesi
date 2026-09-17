import { useTranslations } from 'next-intl'
import CertBadge from '@/components/secciones/CertBadge'
import { CERTIFICACIONES } from '@/lib/certificaciones'

export default function Certificaciones() {
  const t = useTranslations('certificaciones')
  const ta = useTranslations('avales')

  return (
    <section
      id="certificaciones"
      style={{
        backgroundColor: 'var(--color-cream)',
        paddingBlock: 'clamp(48px, 8vw, 80px)',
      }}
    >
      <div className="contenido">

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
            {t('kicker')}
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              color: 'var(--color-crimson)',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            {t('titulo')}
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
            {t('bajada')}
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
              key={cert.clave}
              style={{
                minWidth: 0,
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
              {/* Alto fijo para que los cuatro sellos queden a la misma línea
                  base, aunque uno sea circular y otro apaisado */}
              <div style={{ minHeight: 96, display: 'flex', alignItems: 'center' }}>
                <CertBadge cert={cert} />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '17px',
                  color: 'var(--color-brown)',
                  marginTop: '20px',
                }}
              >
                {ta(`${cert.clave}.nombre`)}
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
                {ta(`${cert.clave}.entidad`)}
              </p>
              {cert.conReferencia && (
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '20px',
                    color: 'var(--color-crimson)',
                    margin: '-6px 0 12px',
                  }}
                >
                  {ta(`${cert.clave}.referencia`)}
                </p>
              )}
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'rgba(135,43,19,.7)',
                }}
              >
                {ta(`${cert.clave}.detalle`)}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

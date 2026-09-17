import { useTranslations } from 'next-intl'
interface Props {
  imagen?: string
}

export default function SobreNosotros({ imagen }: Props) {
  const t = useTranslations('sobreNosotros')

  return (
    <section
      id="sobre-nosotros"
      style={{
        backgroundColor: 'var(--color-brown)',
        paddingBlock: 'clamp(64px, 8vw, 100px)',
      }}
    >
      <div className="contenido">
        <div className="sobre-nosotros-grid">

          {/* Columna izquierda — imagen */}
          <div
            className="about-media"
            style={{
              background: imagen
                ? undefined
                : 'repeating-linear-gradient(135deg, #9A3417 0 14px, #8A2E14 14px 28px)',
            }}
          >
            {imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagen}
                alt={t('fotoAlt')}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '12px' }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  color: 'rgba(255,234,202,.35)',
                  textTransform: 'uppercase',
                }}
              >
                {t('fotoPlaceholder')}
              </span>
            )}
          </div>

          {/* Columna derecha — texto */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--color-gold)',
                marginBottom: '16px',
              }}
            >
              {t('kicker')}
            </p>

            {/* H2 */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                color: 'var(--color-cream)',
                lineHeight: 1.2,
                marginBottom: '20px',
              }}
            >
              {t('titulo')}
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 'clamp(16px, 1.6vw, 18px)',
                color: 'rgba(255,234,202,.85)',
                lineHeight: 1.7,
                marginBottom: '16px',
              }}
            >
              {t('texto')}
            </p>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 'clamp(16px, 1.6vw, 18px)',
                color: 'rgba(255,234,202,.85)',
                lineHeight: 1.7,
                marginBottom: '32px',
              }}
            >
              {/* OJO: este párrafo repite la idea con la que ya cierra
                  t('texto') —«Cada visita es un vuelo a los sentidos…»—.
                  Se migró tal cual para no cambiar el copy por cuenta
                  propia, pero probablemente sobre uno de los dos. */}
              {t('texto2')}
            </p>

            {/* CTA ghost */}
            <div>
              <a href="/sobre-nosotros" className="btn-ghost-cream">
                {t('cta')}
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

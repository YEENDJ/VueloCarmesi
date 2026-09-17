import { useTranslations } from 'next-intl'
// Claves del catálogo, no texto: se traducen al pintarlas.
const PRACTICAS = [
  'especies', 'hidricas', 'responsable', 'recursos', 'educacion', 'turismo',
] as const

interface Props {
  /** Las claves de SiteConfig con las cifras. Ver PruebaSocial: mismo trato. */
  cifras?: Record<string, string>
}

/**
 * Las tres cifras de impacto social, con su clave en SiteConfig y su respaldo.
 *
 * El respaldo cubre el caso de que la API de configuración no responda:
 * `getSiteConfig` devuelve `{}` en vez de lanzar, así que sin él las tres
 * tarjetas saldrían vacías. Se editan en Configuración → Cifras de impacto.
 */
const IMPACTO = [
  {
    clave: 'impacto_familias_directas',
    respaldo: '2',
    etiqueta: 'directas',
  },
  {
    clave: 'impacto_familias_indirectas',
    respaldo: '8',
    etiqueta: 'indirectas',
  },
  {
    clave: 'impacto_empleos',
    respaldo: '6',
    etiqueta: 'empleos',
  },
]

export default function ImpactoSocial({ cifras }: Props) {
  const t = useTranslations('nosotros.impacto')

  return (
    <section
      style={{
        backgroundColor: '#FFF6E4',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px 28px',
            marginBottom: '48px',
          }}
        >
          {PRACTICAS.map((p) => (
            <div
              key={t(`practicas.${p}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 'clamp(15px, 1.5vw, 17px)',
                color: 'var(--color-brown)',
              }}
            >
              <span style={{ color: 'var(--color-crimson)', fontSize: '18px', flex: 'none' }}>
                ✦
              </span>
              {t(`practicas.${p}`)}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          {IMPACTO.map((i) => (
            <div
              key={i.clave}
              style={{
                // Hijo de grid con texto: «familias beneficiadas indirectamente»
                // no cabe de una pieza y sin esto la celda se niega a encoger.
                minWidth: 0,
                padding: '24px',
                backgroundColor: 'var(--color-brown)',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(36px, 5vw, 44px)',
                  color: 'var(--color-gold)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {cifras?.[i.clave]?.trim() || i.respaldo}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'rgba(255,234,202,.85)',
                  lineHeight: 1.3,
                }}
              >
                {t(i.etiqueta)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

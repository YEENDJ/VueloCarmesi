import { useTranslations } from 'next-intl'
interface Props {
  /**
   * Las claves de SiteConfig con las cifras. Se pasan enteras y cada tarjeta
   * saca la suya, en vez de cinco props sueltas que habría que enchufar una a
   * una cada vez que se añada un dato.
   */
  cifras?: Record<string, string>
}

/**
 * Las cinco cifras de impacto, con su clave en SiteConfig y su respaldo.
 *
 * El respaldo no es decorativo: `getSiteConfig` devuelve `{}` cuando la API no
 * responde —no lanza, para que una caída del backend no tumbe la home—, así que
 * sin él la sección se quedaría con cinco tarjetas en blanco justo en el bloque
 * que existe para dar confianza. Con respaldo, lo peor que pasa es que las
 * cifras se queden en las de la última publicación.
 *
 * Son editables desde el panel: Configuración → Cifras de impacto.
 */
const STATS = [
  { clave: 'impacto_personas', respaldo: '692', t: 'personas' },
  { clave: 'impacto_instituciones', respaldo: '8', t: 'instituciones' },
  { clave: 'impacto_organizaciones', respaldo: '7', t: 'organizacionesCifra' },
  { clave: 'impacto_familias', respaldo: '28', t: 'familias' },
  { clave: 'impacto_extranjeros', respaldo: '15', t: 'extranjeros' },
]

const ORGANIZACIONES = [
  'Uniandes',
  'Unillanos',
  'SENA',
  'Unimeta',
  'Uniminuto',
  'Ecopetrol',
  'Fedecacao',
  'Socodevi',
  'Rare',
]

export default function PruebaSocial({ cifras }: Props) {
  const t = useTranslations('pruebaSocial')

  return (
    <section
      style={{
        backgroundColor: 'var(--color-brown)',
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
              color: 'var(--color-gold)',
              marginBottom: '16px',
            }}
          >
            {t('kicker')}
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              color: 'var(--color-cream)',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            {/* «Cientos» y no «Miles»: la primera tarjeta de aquí abajo dice
                692 y desmentía al titular a diez centímetros. Una cifra que
                contradice al texto que tiene al lado no resta credibilidad al
                titular, se la resta al número, que es lo que de verdad vende. */}
            {t('titulo')}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 'clamp(16px, 1.6vw, 18px)',
              color: 'rgba(255,234,202,.8)',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '20px',
            marginBottom: '56px',
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.clave}
              style={{
                // Hijo de grid con texto: sin esto la celda no baja del ancho
                // de «instituciones educativas» y desborda en pantalla chica.
                minWidth: 0,
                textAlign: 'center',
                padding: '28px 16px',
                backgroundColor: 'rgba(255,234,202,.06)',
                border: '1px solid rgba(255,234,202,.1)',
                borderRadius: '12px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(36px, 6vw, 48px)',
                  color: 'var(--color-gold)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {cifras?.[s.clave]?.trim() || s.respaldo}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--color-cream)',
                  marginBottom: '4px',
                }}
              >
                {t(`${s.t}.etiqueta`)}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'rgba(255,234,202,.55)',
                }}
              >
                {t(`${s.t}.detalle`)}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,234,202,.5)',
              marginBottom: '20px',
            }}
          >
            {t('organizaciones')}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '12px 20px',
            }}
          >
            {ORGANIZACIONES.map((org) => (
              <span
                key={org}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'rgba(255,234,202,.7)',
                  padding: '8px 18px',
                  border: '1px solid rgba(255,234,202,.12)',
                  borderRadius: '999px',
                }}
              >
                {org}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

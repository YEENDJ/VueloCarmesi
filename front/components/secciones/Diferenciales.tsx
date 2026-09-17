import { useTranslations } from 'next-intl'

/**
 * Las seis claves del bloque, en orden. El texto vive en messages/*.json.
 *
 * Las cifras del primero —«1.300 plantas», «12 variedades»— están escritas en
 * el catálogo y no vienen de SiteConfig porque este componente no recibe la
 * config; si cambian, se cambian en los DOS idiomas a la vez. Ojo con el
 * formato: 1.300 en español es 1,300 en inglés.
 */
const CLAVES = [
  'origen',
  'sostenible',
  'artesanal',
  'biodiversidad',
  'autenticas',
  'seguro',
] as const


export default function Diferenciales() {
  const t = useTranslations('diferenciales')

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
          
        </div>

        {/* min(300px, 100%) y no 300px a secas: a 320px de viewport el interior
            de .contenido mide 288px —el padding-inline se lleva 2 x 16px— y una
            columna que exige 300 desborda la pantalla. Con min() el mínimo cede
            al ancho disponible cuando no cabe, que es el mismo patrón que usa
            .politicas-grid en globals.css. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: '24px',
          }}
        >
          {CLAVES.map((clave, i) => (
            <div
              key={clave}
              style={{
                // Hijo de grid con texto dentro: sin esto su min-width es auto
                // y la celda se niega a bajar del ancho de su palabra más larga.
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                padding: '28px 24px',
                backgroundColor: '#FFF6E4',
                border: '1px solid rgba(135,43,19,.12)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    flex: 'none',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-gold)',
                    color: 'var(--color-brown)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  style={{
                    // Va al lado del disco de 40px, que es flex:none: el que
                    // tiene que encoger es el título, y con min-width auto se
                    // niega y empuja la fila fuera de la tarjeta.
                    minWidth: 0,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: 'clamp(18px, 2vw, 20px)',
                    color: 'var(--color-brown)',
                    margin: 0,
                  }}
                >
                  {t(`${clave}.titulo`)}
                </h3>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: 'rgba(135,43,19,.75)',
                  margin: 0,
                }}
              >
                {t(`${clave}.texto`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import { getExperienciaBySlug } from '@/lib/api/experiencias'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ReservaForm from '@/components/booking/ReservaForm'
import { ReservaPersonasProvider, ResumenReservaVivo } from '@/components/booking/ResumenReserva'
import MigaSuperior from '@/components/layout/MigaSuperior'
import { notFound } from 'next/navigation'
import { formatPrecio } from '@/lib/format'
import AvisoEscnna from '@/components/legal/AvisoEscnna'
import { getConfigPagos } from '@/lib/api/pagos'

// El segmento caduca siempre: sin esto un 404 renderizado durante una caída del
// backend quedaba cacheado de forma indefinida.
export const revalidate = 60

/**
 * El formulario de reserva no entra al índice.
 *
 * Es un paso del embudo, no un destino de búsqueda: quien busca la
 * experiencia tiene que llegar a /experiencias/[slug], que sí la describe y
 * sí enlaza aquí. Indexar las dos hace que compitan entre ellas por la misma
 * consulta y la que gana es la que menos cuenta.
 *
 * `follow: true` porque la miga y el resumen de la experiencia siguen siendo
 * enlaces internos legítimos que conviene que el rastreador recorra.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('reserva')
  const [exp, pagos] = await Promise.all([getExperienciaBySlug(slug, locale), getConfigPagos()])
  if (!exp) notFound()

  const thumbnail = exp.imagenes?.[0] ?? exp.imagen

  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100svh' }}>
      {/* 16px arriba y no los 40–64 de una página con titular: lo primero es
          la miga, y con ese respiro quedaba flotando lejos del navbar. Es el
          mismo que deja .miga-marco en la ficha de experiencia. */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px clamp(16px,4vw,24px) 80px' }}>

        {/* El padre de esta pantalla NO es el listado sino la ficha de la que
            se vino: es el paso anterior del embudo, y quien está a medio
            reservar quiere volver a mirar un dato de ESA experiencia, no
            empezar de cero. */}
        <MigaSuperior
          href={{ pathname: '/experiencias/[slug]', params: { slug } }}
          etiqueta={exp.nombre}
          actual={t('tituloFormulario')}
        />

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
            {t('tituloFormulario')}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--color-brown)',
              opacity: 0.7,
            }}
          >
            {t('bajadaFormulario')}
          </p>
        </div>

        {/* Two-column grid. El proveedor comparte las personas elegidas en el
            formulario con el resumen de la tarjeta. */}
        <ReservaPersonasProvider>
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
              <ReservaForm experiencia={exp} pagos={pagos} />
              <AvisoEscnna />
            </div>
          </div>

          {/* Right — summary. Lo fijo va en .reserva-summary (globals.css), no
              en este div: dentro de un contenedor de su misma altura el sticky
              no tenía recorrido y la tarjeta se iba con el scroll. */}
          <div className="reserva-summary">
            <div
              style={{
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
                  fontSize: '13px',
                  color: 'var(--color-gold)',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                {t('estasReservando')}
              </p>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 5vw, 28px)',
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
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-cream)' }}>
                  <span style={{ color: 'var(--color-amber)', fontWeight: 700 }}>
                    {formatPrecio(exp.precio, locale)}
                  </span>
                  {' '}{t('porPersona')}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-cream)' }}>
                  ⏱ {exp.duracion}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-cream)' }}>
                  👥 {t('hastaPersonas', { n: exp.capacidad })}
                </p>
              </div>

              <ResumenReservaVivo precio={exp.precio} pagos={pagos} />

              <div style={{ borderTop: '1px solid rgba(253,195,0,.3)', paddingTop: '16px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(255,234,202,.6)',
                    lineHeight: 1.6,
                  }}
                >
                  {/* Con cobro en línea, «sin compromiso de pago» deja de ser cierto. */}
                  {pagos.activo ? t('pago.lateral', { porcentaje: pagos.porcentajeAbono }) : t('sinCompromiso')}
                </p>
              </div>
            </div>
          </div>

        </div>
        </ReservaPersonasProvider>
      </div>
    </div>
  )
}

import ExperienciaCard from '@/components/booking/ExperienciaCard'
import AvisoAviturismo from '@/components/booking/AvisoAviturismo'
import AvisoGrupos from '@/components/grupos/AvisoGrupos'
import { getExperiencias } from '@/lib/api/experiencias'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'experiencias' })
  return {
    title: t('tituloListado'),
    alternates: alternatesDeIdioma('/experiencias', locale),
  }
}

export default async function ExperienciasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [experiencias, tExp, t] = await Promise.all([
    getExperiencias(locale),
    getTranslations('experiencias'),
    getTranslations('reserva'),
  ])

  return (
    <section className="page-shell page-shell--listado" style={{ maxWidth: '1200px' }}>
      <h1 className="solo-lectores">{tExp('tituloListado')}</h1>
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
          {t('catalogoVacio')}
        </p>
      ) : (
        <div className="experiencias-grid">
          {experiencias.map(exp => <ExperienciaCard key={exp.id} experiencia={exp} />)}
        </div>
      )}

      {/* Debajo de la rejilla y no encima: quien entra al listado viene a ver
          qué se puede hacer en la finca, y un aviso antes de la primera tarjeta
          se lleva por delante justo eso. Abajo lo encuentra el que ya miró la
          oferta y sigue buscando aves — y se pinta también con el listado
          vacío, que es cuando más falta hace tener algo a dónde ir. */}
      <AvisoAviturismo variante="listado" />

      {/* Mismo criterio, y por eso va junto al de aviturismo: quien mira el
          listado con ojos de coordinador ya vio que las capacidades son de 8 y
          12, así que es justo acá donde necesita saber que los grupos grandes
          se atienden por otra vía. */}
      <AvisoGrupos variante="listado" />
    </section>
  )
}

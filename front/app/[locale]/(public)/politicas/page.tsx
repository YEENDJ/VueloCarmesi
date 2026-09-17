import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { ArrowRight, CalendarX, ShieldCheck, type LucideIcon } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'politicas.indice' })
  return {
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/politicas', locale),
  }
}

type Politica = {
  href: '/politicas/proteccion-infancia' | '/politicas/cancelacion'
  /** Clave dentro de `politicas.indice`; el texto vive en messages/*.json. */
  clave: 'ninez' | 'cancelacion'
  Icono: LucideIcon
}

/**
 * Índice de políticas del prestador turístico. Cada tarjeta es un enlace a la
 * política completa; se agrega una entrada aquí conforme exista el texto.
 * PENDIENTE: cuando existan, se suman el tratamiento de datos personales
 * (Ley 1581 de 2012) y los términos y condiciones de la tienda.
 */
const POLITICAS: Politica[] = [
  { href: '/politicas/proteccion-infancia', clave: 'ninez', Icono: ShieldCheck },
  { href: '/politicas/cancelacion', clave: 'cancelacion', Icono: CalendarX },
]

export default async function PoliticasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('politicas.indice')

  return (
    <section className="page-shell politicas">
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        {t('titulo')}
      </h1>
      <p className="politica-fecha">
        {t('bajada')}
      </p>

      <div className="politicas-grid">
        {POLITICAS.map(({ href, clave, Icono }) => (
          <Link key={href} href={href} className="politicas-tarjeta">
            <span className="politicas-tarjeta-encabezado">
              <span className="politica-icono" aria-hidden="true">
                <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
              </span>
              <span className="politicas-tarjeta-titulo">{t(`${clave}.titulo`)}</span>
              <ArrowRight
                size={20}
                strokeWidth={1.9}
                className="politicas-tarjeta-flecha"
                aria-hidden="true"
              />
            </span>
            <p className="politicas-tarjeta-resumen">{t(`${clave}.resumen`)}</p>
            <span className="politicas-tarjeta-fuente">{t(`${clave}.fuente`)}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
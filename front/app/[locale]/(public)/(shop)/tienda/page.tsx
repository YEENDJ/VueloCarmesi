import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import TiendaGrid from '@/components/shop/TiendaGrid'
import { getProductos } from '@/lib/api/productos'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nav' })
  return {
    title: t('tienda'),
    alternates: alternatesDeIdioma('/tienda', locale),
  }
}

export default async function TiendaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [productos, t] = await Promise.all([
    getProductos(locale),
    getTranslations('nav'),
  ])

  return (
    <section className="page-shell page-shell--listado" style={{ maxWidth: '1200px' }}>
      <h1 className="solo-lectores">{t('tienda')}</h1>
      <TiendaGrid productos={productos} />
    </section>
  )
}

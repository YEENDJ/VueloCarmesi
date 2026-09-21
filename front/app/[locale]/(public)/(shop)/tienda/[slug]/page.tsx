import { getProductoBySlug, getProductos } from '@/lib/api/productos'
import Badge from '@/components/ui/Badge'
import GaleriaProducto from '@/components/shop/GaleriaProducto'
import FichaPestanas from '@/components/shop/FichaPestanas'
import ProductoCard from '@/components/shop/ProductoCard'
import PanelCompra from './PanelCompra'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import PublicarSlugs from '@/components/layout/PublicarSlugs'
import MigaSuperior from '@/components/layout/MigaSuperior'
import { permanentRedirect as permanentRedirectIdioma } from '@/lib/i18n/navigation'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { SLUGS_PRODUCTOS_LEGADOS, destinoLegado } from '@/lib/slugs-legados'
import { formatPrecio } from '@/lib/format'
import { metaDescription } from '@/lib/seo'
import type { Metadata } from 'next'
import { CreditCard, ShieldCheck, Store } from 'lucide-react'

// El segmento caduca siempre, haya respondido el backend o no. Sin esto Next
// deriva el revalidate solo de los fetch que completaron: un detalle renderizado
// durante una caída se guardaba como 404 permanente e ni revalidateTag lo tocaba.
export const revalidate = 60
export const dynamicParams = true

/**
 * Ver la ficha de experiencia: hasta ahora todas las fichas compartían la
 * metadata del layout. Cada producto pasa a tener la suya.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> },
): Promise<Metadata> {
  const { slug, locale } = await params
  const producto = await getProductoBySlug(slug, locale).catch(() => null)
  if (!producto) return {}

  const descripcion = metaDescription(producto.descripcion, producto.descripcionLarga)
  const portada = producto.imagenes?.[0] ?? producto.imagen

  return {
    title: `${producto.nombre} · Vuelo Carmesí`,
    description: descripcion,
    alternates: alternatesDeIdioma(
      // El slug de CADA idioma sale de producto.slugs, que trae el backend.
      idioma => ({
        pathname: '/tienda/[slug]',
        params: { slug: producto.slugs?.[idioma] ?? producto.slug },
      }),
      locale,
    ),
    openGraph: {
      title: producto.nombre,
      description: descripcion,
      type: 'website',
      ...(portada ? { images: [portada] } : {}),
    },
  }
}

/**
 * Los slugs cambian con el idioma —/tienda/vino-de-cafe-x-375-ml y
 * /en/shop/coffee-liqueur-x-375-ml son la misma ficha—, asi que hay que pedir
 * el catalogo en el idioma que Next esta prerenderizando. Devolver los slugs
 * espanoles para las dos ramas dejaria el ingles sin paginas estaticas.
 */
export async function generateStaticParams({
  params,
}: {
  params: { locale: string }
}) {
  try {
    const productos = await getProductos(params.locale)
    return productos.map(p => ({ slug: p.slug }))
  } catch {
    // Prerenderizar es solo una optimización: si la API no está disponible en el
    // build, cada detalle se genera bajo demanda en vez de romper el despliegue.
    return []
  }
}

const AVALES = ['avalBpa', 'avalMarca'] as const

/** Saca el contenido del nombre ("… x 375 ml") para mostrarlo como dato duro. */
function contenidoDelNombre(nombre: string): string | null {
  const m = nombre.match(/x\s*([\d.,]+\s*(?:ml|l|g|gr|gramos|kg|cc|unidades?))\b/i)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')

  const [producto, todos, t] = await Promise.all([
    getProductoBySlug(slug, locale),
    getProductos(locale),
    getTranslations('tienda.ficha'),
  ])
  if (!producto) {
    // Ver la ficha de experiencia: rescate de slugs viejos antes del 404.
    const destino = destinoLegado(SLUGS_PRODUCTOS_LEGADOS, slug)
    if (destino) permanentRedirect(`/tienda/${destino}`)
    notFound()
  }

  // Ver la ficha de experiencia: una sola URL canónica por idioma, para no
  // repartir el posicionamiento entre el slug español y el inglés.
  if (producto.slug && producto.slug !== slug) {
    permanentRedirectIdioma({
      href: { pathname: '/tienda/[slug]', params: { slug: producto.slug } },
      locale,
    })
  }

  const imagenes = producto.imagenes?.length
    ? producto.imagenes
    : producto.imagen ? [producto.imagen] : []
  const descripcion = producto.descripcionLarga?.trim() || producto.descripcion

  const contenido = contenidoDelNombre(producto.nombre)
  const especificaciones = [
    ...(contenido ? [{ etiqueta: t('contenido'), valor: contenido }] : []),
    { etiqueta: t('categoria'), valor: producto.categoria },
    { etiqueta: t('disponibles'), valor: t('unidades', { n: producto.stock }) },
  ]

  const relacionados = todos
    .filter(p => p.categoria === producto.categoria && p.slug !== slug)
    .slice(0, 4)

  return (
    <div className="ficha-prod">
      {/* No pinta nada: le da al selector de idioma el slug de esta ficha en
          cada lengua, para que cambiar de idioma no pierda la ficha. */}
      <PublicarSlugs slugs={producto.slugs} />
      {/* Estas migas estaban acá comentadas desde el commit de i18n: tenían
          «Migas de pan» y «Tienda» escritos a pelo en español y se
          desactivaron al traducir el sitio, no porque el patrón se descartara.
          Las sustituye el componente, que sí sale del catálogo. */}
      <MigaSuperior href="/tienda" etiqueta={tNav('tienda')} actual={producto.nombre} />

      <div className="ficha-prod-grid">
        <div className="ficha-prod-galeria">
          <GaleriaProducto imagenes={imagenes} alt={producto.nombre} />
        </div>

        <div className="ficha-prod-compra">
          <div className="ficha-prod-panel">
            {producto.badge && (
              <div className="ficha-prod-rotulo">
                <Badge color={producto.badge === 'Nuevo' ? 'amber' : 'orange'}>{producto.badge}</Badge>
              </div>
            )}

            <h1 className="ficha-prod-titulo">{producto.nombre}</h1>

            <p className="ficha-prod-resumen">{producto.descripcion}</p>

            <div className="ficha-prod-precio">
              <span className="ficha-prod-precio-cifra">{formatPrecio(producto.precio, locale)}</span>
              <span className="ficha-prod-precio-nota">{t('ivaIncluido')}</span>
            </div>

            <PanelCompra producto={producto} />

            <div className="ficha-avales">
              <div className="ficha-aval">
                <Store size={15} color="var(--color-amber)" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>{t('vendidoPor')}</span>
              </div>
              <div className="ficha-aval">
                <CreditCard size={15} color="var(--color-amber)" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>{t('coordinamosPago')}</span>
              </div>
              {AVALES.map(aval => (
                <div key={aval} className="ficha-aval">
                  <ShieldCheck size={15} color="var(--color-amber)" aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span style={{ minWidth: 0 }}>{t(aval)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ficha-prod-info">
          <FichaPestanas especificaciones={especificaciones} descripcion={descripcion} />
        </div>
      </div>

      {relacionados.length > 0 && (
        <div style={{ marginTop: 'clamp(48px, 8vw, 64px)' }}>
          <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '32px' }} />
          <h2 style={{ color: 'var(--color-crimson)', marginBottom: '24px', fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
            {t('relacionados')}
          </h2>
          <div className="related-grid">
            {relacionados.map(p => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

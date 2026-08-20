import { getProductoBySlug, getProductos } from '@/lib/api/productos'
import Badge from '@/components/ui/Badge'
import GaleriaProducto from '@/components/shop/GaleriaProducto'
import FichaPestanas from '@/components/shop/FichaPestanas'
import ProductoCard from '@/components/shop/ProductoCard'
import PanelCompra from './PanelCompra'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { SLUGS_PRODUCTOS_LEGADOS, destinoLegado } from '@/lib/slugs-legados'
import { formatPrecio } from '@/lib/format'
import { metaDescription } from '@/lib/seo'
import type { Metadata } from 'next'
import { ChevronRight, CreditCard, ShieldCheck, Store } from 'lucide-react'

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
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const producto = await getProductoBySlug(slug).catch(() => null)
  if (!producto) return {}

  const descripcion = metaDescription(producto.descripcion, producto.descripcionLarga)
  const portada = producto.imagenes?.[0] ?? producto.imagen

  return {
    title: `${producto.nombre} · Vuelo Carmesí`,
    description: descripcion,
    openGraph: {
      title: producto.nombre,
      description: descripcion,
      type: 'website',
      ...(portada ? { images: [portada] } : {}),
    },
  }
}

export async function generateStaticParams() {
  try {
    const productos = await getProductos()
    return productos.map(p => ({ slug: p.slug }))
  } catch {
    // Prerenderizar es solo una optimización: si la API no está disponible en el
    // build, cada detalle se genera bajo demanda en vez de romper el despliegue.
    return []
  }
}

const AVALES = [
  'Cosecha propia · Finca El Edén',
  'Buenas Prácticas Agrícolas · ICA',
  'Marca registrada ante la SIC',
]

/** Saca el contenido del nombre ("… x 375 ml") para mostrarlo como dato duro. */
function contenidoDelNombre(nombre: string): string | null {
  const m = nombre.match(/x\s*([\d.,]+\s*(?:ml|l|g|gr|gramos|kg|cc|unidades?))\b/i)
  return m ? m[1].replace(/\s+/g, ' ').trim() : null
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [producto, todos] = await Promise.all([
    getProductoBySlug(slug),
    getProductos(),
  ])
  if (!producto) {
    // Ver la ficha de experiencia: rescate de slugs viejos antes del 404.
    const destino = destinoLegado(SLUGS_PRODUCTOS_LEGADOS, slug)
    if (destino) permanentRedirect(`/tienda/${destino}`)
    notFound()
  }

  const imagenes = producto.imagenes?.length
    ? producto.imagenes
    : producto.imagen ? [producto.imagen] : []
  const descripcion = producto.descripcionLarga?.trim() || producto.descripcion

  const contenido = contenidoDelNombre(producto.nombre)
  const especificaciones = [
    ...(contenido ? [{ etiqueta: 'Contenido', valor: contenido }] : []),
    { etiqueta: 'Categoría', valor: producto.categoria },
    { etiqueta: 'Disponibles', valor: `${producto.stock} unidades` },
  ]

  const relacionados = todos
    .filter(p => p.categoria === producto.categoria && p.slug !== slug)
    .slice(0, 4)

  return (
    <div className="ficha-prod">
      <nav className="ficha-migas" aria-label="Migas de pan">
        <Link href="/tienda" style={{ color: 'inherit' }}>Tienda</Link>
        <ChevronRight size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span>{producto.categoria}</span>
        <ChevronRight size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ color: 'var(--color-brown)', fontWeight: 700, minWidth: 0, overflowWrap: 'anywhere' }}>
          {producto.nombre}
        </span>
      </nav>

      <div className="ficha-prod-grid">
        <div className="ficha-prod-galeria">
          <GaleriaProducto imagenes={imagenes} alt={producto.nombre} />
        </div>

        <div className="ficha-prod-compra">
          <div className="ficha-prod-panel">
            <div className="ficha-prod-rotulo">
              <span className="ficha-eyebrow" style={{ color: 'rgba(135,43,19,0.55)', minWidth: 0 }}>
                {producto.categoria}
              </span>
              {producto.badge && (
                <Badge color={producto.badge === 'Nuevo' ? 'amber' : 'orange'}>{producto.badge}</Badge>
              )}
            </div>

            <h1 className="ficha-prod-titulo">{producto.nombre}</h1>

            <p className="ficha-prod-resumen">{producto.descripcion}</p>

            <div className="ficha-prod-precio">
              <span className="ficha-prod-precio-cifra">{formatPrecio(producto.precio)}</span>
              <span className="ficha-prod-precio-nota">IVA incluido</span>
            </div>

            <PanelCompra producto={producto} />

            <div className="ficha-avales">
              <div className="ficha-aval">
                <Store size={15} color="var(--color-amber)" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>Vendido por Vuelo Carmesí</span>
              </div>
              <div className="ficha-aval">
                <CreditCard size={15} color="var(--color-amber)" aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0 }}>Coordinamos el pago al confirmar el pedido</span>
              </div>
              {AVALES.map(aval => (
                <div key={aval} className="ficha-aval">
                  <ShieldCheck size={15} color="var(--color-amber)" aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span style={{ minWidth: 0 }}>{aval}</span>
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
            Productos relacionados
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

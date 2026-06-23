import { getProductoBySlug, getProductos } from '@/lib/api/productos'
import Badge from '@/components/ui/Badge'
import ImageGallery from '@/components/ui/ImageGallery'
import ProductoCard from '@/components/shop/ProductoCard'
import AddToCartSection from './AddToCartSection'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const productos = await getProductos()
  return productos.map(p => ({ slug: p.slug }))
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
  if (!producto) notFound()

  const images = producto.images ?? []

  const relacionados = todos
    .filter(p => p.categoria === producto.categoria && p.slug !== slug)
    .slice(0, 4)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Main 2-column grid */}
      <div className="detail-grid-prod">
        {/* Gallery */}
        <div>
          <ImageGallery images={images} alt={producto.nombre} aspectRatio="1/1" />
        </div>

        {/* Info */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <Badge color="amber">{producto.categoria}</Badge>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              color: 'var(--color-brown)',
              marginBottom: '12px',
              lineHeight: 1.15,
            }}
          >
            {producto.nombre}
          </h1>

          <p
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-amber)',
              fontFamily: 'var(--font-body)',
              marginBottom: '16px',
            }}
          >
            ${producto.precio.toLocaleString('es-AR')}
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'var(--color-brown)',
              marginBottom: '24px',
            }}
          >
            {producto.descripcion}
          </p>

          <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '24px' }} />

          <AddToCartSection producto={producto} />
        </div>
      </div>

      {/* Related products */}
      {relacionados.length > 0 && (
        <div style={{ marginTop: '64px' }}>
          <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '32px' }} />
          <h2 style={{ color: 'var(--color-crimson)', marginBottom: '24px' }}>
            También te puede gustar
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

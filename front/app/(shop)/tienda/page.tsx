import ProductoCard from '@/components/shop/ProductoCard'
import { getProductos } from '@/lib/api/productos'

export default async function TiendaPage() {
  const productos = await getProductos()
  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Tienda</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Llevate el sabor a casa.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {productos.map(p => <ProductoCard key={p.id} producto={p} />)}
      </div>
    </section>
  )
}

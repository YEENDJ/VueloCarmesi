import TiendaGrid from '@/components/shop/TiendaGrid'
import { getProductos } from '@/lib/api/productos'

export default async function TiendaPage() {
  const productos = await getProductos()
  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Tienda</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Llevate el sabor a casa.</p>
      <TiendaGrid productos={productos} />
    </section>
  )
}

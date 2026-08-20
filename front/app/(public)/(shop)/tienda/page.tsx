import TiendaGrid from '@/components/shop/TiendaGrid'
import { getProductos } from '@/lib/api/productos'

export const revalidate = 60

export default async function TiendaPage() {
  const productos = await getProductos()
  return (
    <section className="page-shell page-shell--listado" style={{ maxWidth: '1200px' }}>
      <h1 className="solo-lectores">Tienda</h1>
      <TiendaGrid productos={productos} />
    </section>
  )
}

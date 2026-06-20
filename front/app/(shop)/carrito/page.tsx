'use client'
import { useCarrito } from '@/lib/useCarrito'
import Button from '@/components/ui/Button'

export default function CarritoPage() {
  const { items, quitar, total } = useCarrito()

  if (items.length === 0) return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>Tu carrito está vacío</h1>
      <Button href="/tienda">Ir a la tienda</Button>
    </section>
  )

  return (
    <section style={{ maxWidth: '700px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Carrito</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {items.map(({ producto, cantidad }) => (
          <div key={producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{producto.nombre}</p>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{cantidad} × ${producto.precio.toLocaleString('es-AR')}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>${(producto.precio * cantidad).toLocaleString('es-AR')}</span>
              <button onClick={() => quitar(producto.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-crimson)', fontSize: '1.2rem' }}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>Total: ${total.toLocaleString('es-AR')}</p>
        <Button href="/checkout">Ir al checkout</Button>
      </div>
    </section>
  )
}

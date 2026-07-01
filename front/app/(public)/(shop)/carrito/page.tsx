'use client'
import { useCart } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import Button from '@/components/ui/Button'
import QuantitySelector from '@/components/ui/QuantitySelector'

export default function CarritoPage() {
  const { items, cartCount, cartTotal, inc, dec, remove, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Tu carrito está vacío</h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Descubrí nuestros chocolates y cacao artesanal.</p>
        <Button href="/tienda">Ver tienda</Button>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0 }}>
        <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Carrito</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(item => (
            <div key={item.productoId} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 0',
              borderBottom: '1px solid rgba(135,43,19,0.1)', flexWrap: 'wrap',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '8px', flex: 'none',
                backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.75rem' }}>🍫</span>
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--color-brown)' }}>{item.nombre}</p>
                <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>{formatPrecio(item.precio)} c/u</p>
              </div>
              <QuantitySelector
                value={item.q}
                onChange={next => next > item.q ? inc(item.productoId) : dec(item.productoId)}
                min={1}
                max={item.stock}
              />
              <span style={{ fontWeight: 700, color: 'var(--color-amber)', minWidth: '90px', textAlign: 'right' }}>
                {formatPrecio(item.precio * item.q)}
              </span>
              <button
                onClick={() => remove(item.productoId)}
                title="Quitar"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(135,43,19,0.5)' }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Button href="/tienda" variant="outline">← Seguir comprando</Button>
          <button
            onClick={clearCart}
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
              color: 'rgba(135,43,19,0.7)', background: 'transparent',
              border: '1.5px solid rgba(135,43,19,0.25)', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer',
            }}
          >
            🗑 Vaciar carrito
          </button>
        </div>
      </div>

      <div style={{
        flex: '0 1 320px', minWidth: '280px', position: 'sticky', top: '96px',
        background: 'var(--color-cream)', border: '1px solid rgba(135,43,19,0.15)',
        borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(135,43,19,0.16)',
      }}>
        <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-brown)' }}>Resumen del pedido</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)', marginBottom: '0.6rem' }}>
          <span>Subtotal ({cartCount} art.)</span>
          <span>{formatPrecio(cartTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)' }}>
          <span>Envío</span>
          <span style={{ color: '#1F8A5B' }}>A coordinar</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-brown)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal)}</span>
        </div>
        <Button href="/checkout" style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: '1.5rem' }}>
          Ir al checkout
        </Button>
      </div>
    </section>
  )
}

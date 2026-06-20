'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCarrito } from '@/lib/useCarrito'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total } = useCarrito()
  const [form, setForm] = useState({ nombre: '', email: '', direccion: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, total }),
      })
    } catch {
      // continuar a confirmacion aunque el back falle (demo)
    }
    localStorage.removeItem('carrito')
    router.push('/tienda')
  }

  if (items.length === 0) return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>No hay productos en tu carrito</h1>
      <Button href="/tienda">Ir a la tienda</Button>
    </section>
  )

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Checkout</h1>
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Resumen del pedido</p>
        {items.map(({ producto, cantidad }) => (
          <div key={producto.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <span>{producto.nombre} × {cantidad}</span>
            <span>${(producto.precio * cantidad).toLocaleString('es-AR')}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--color-amber)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: 'var(--color-crimson)' }}>${total.toLocaleString('es-AR')}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Input label="Nombre completo" name="nombre" required value={form.nombre} onChange={handleChange} />
        <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
        <Input label="Dirección de entrega" name="direccion" required value={form.direccion} onChange={handleChange} />
        <Button type="submit" disabled={loading}>{loading ? 'Procesando...' : 'Confirmar pedido'}</Button>
      </form>
    </section>
  )
}

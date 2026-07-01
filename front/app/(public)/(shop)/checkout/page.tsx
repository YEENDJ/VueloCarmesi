'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart, setLastOrder } from '@/lib/cart/store'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/cart/checkout-schema'
import { formatPrecio } from '@/lib/format'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, cartTotal, clearCart } = useCart()
  const [submitError, setSubmitError] = useState('')
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema) })

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map(i => ({ productoId: i.productoId, cantidad: i.q })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? `Error ${res.status}`)
      }
      const pedido = await res.json()
      setLastOrder({
        code: `#VC-${String(pedido.id).slice(-6).toUpperCase()}`,
        items: items.map(i => ({ nombre: i.nombre, q: i.q, subtotal: i.precio * i.q })),
        total: cartTotal,
      })
      clearCart()
      router.push('/checkout/confirmacion')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo procesar el pedido')
    }
  }

  if (items.length === 0) {
    return (
      <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>No hay productos en tu carrito</h1>
        <Button href="/tienda">Ir a la tienda</Button>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 style={{ color: 'var(--color-brown)' }}>Checkout</h1>

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0 }}>Datos de contacto</h3>
        <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Teléfono" type="tel" error={errors.telefono?.message} {...register('telefono')} />

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0 }}>Datos de entrega</h3>
        <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
        <Input label="Ciudad" error={errors.ciudad?.message} {...register('ciudad')} />
        <Input label="Código postal" error={errors.codigoPostal?.message} {...register('codigoPostal')} />

        {submitError && <p style={{ color: 'var(--color-crimson)', fontSize: '0.9rem' }}>{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : `Confirmar pedido · ${formatPrecio(cartTotal)}`}
        </Button>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(135,43,19,0.6)' }}>
          Al confirmar aceptás nuestras condiciones de venta
        </p>
      </form>

      <div style={{
        flex: '0 1 320px', minWidth: '280px', position: 'sticky', top: '96px',
        background: 'var(--color-brown)', borderRadius: '12px', padding: '2rem',
      }}>
        <p style={{
          fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase',
          color: 'var(--color-gold)', marginBottom: '1.1rem',
        }}>
          Resumen de tu pedido
        </p>
        {items.map(item => (
          <div key={item.productoId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)', flex: 1 }}>{item.nombre}</span>
            <span style={{ fontWeight: 700, fontSize: '0.75rem', background: 'var(--color-amber)', color: 'var(--color-brown)', borderRadius: '999px', padding: '2px 8px' }}>
              ×{item.q}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{formatPrecio(item.precio * item.q)}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(253,195,0,0.4)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-cream)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal)}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,234,202,0.6)', marginTop: '1rem' }}>
          Coordinamos el método de pago al confirmar el pedido.
        </p>
      </div>
    </section>
  )
}

'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart, setLastOrder } from '@/lib/cart/store'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/cart/checkout-schema'
import { formatPrecio } from '@/lib/format'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CheckoutPage() {
  const idioma = useLocale()

  const t = useTranslations('tienda.checkout')

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
      setSubmitError(err instanceof Error ? err.message : t('errorPedido'))
    }
  }

  if (items.length === 0) {
    return (
      <section className="page-shell" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>{t('vacio')}</h1>
        <Button href="/tienda">{t('irTienda')}</Button>
      </section>
    )
  }

  return (
    <section className="page-shell shop-columns" style={{ maxWidth: '1000px' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="shop-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 style={{ color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>Checkout</h1>

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0, fontSize: 'var(--fs-h3)' }}>{t('datosContacto')}</h3>
        <Input label={t('nombre')} error={errors.nombre?.message && t(errors.nombre.message)} {...register('nombre')} />
        <Input label={t('email')} type="email" error={errors.email?.message && t(errors.email.message)} {...register('email')} />
        <Input label={t('telefono')} type="tel" error={errors.telefono?.message && t(errors.telefono.message)} {...register('telefono')} />

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0, fontSize: 'var(--fs-h3)' }}>{t('datosEntrega')}</h3>
        <Input label={t('direccion')} error={errors.direccion?.message && t(errors.direccion.message)} {...register('direccion')} />
        <Input label={t('ciudad')} error={errors.ciudad?.message && t(errors.ciudad.message)} {...register('ciudad')} />
        <Input label={t('codigoPostal')} error={errors.codigoPostal?.message && t(errors.codigoPostal.message)} {...register('codigoPostal')} />

        {submitError && <p style={{ color: 'var(--color-crimson)', fontSize: '0.9rem' }}>{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('procesando')
            : t('confirmar', { total: formatPrecio(cartTotal, idioma) })}
        </Button>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'rgba(135,43,19,0.6)' }}>
          {t('condiciones')}
        </p>
      </form>

      <div className="shop-aside" style={{
        background: 'var(--color-brown)', borderRadius: '12px', padding: '2rem',
      }}>
        <p style={{
          fontWeight: 700, fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase',
          color: 'var(--color-gold)', marginBottom: '1.1rem',
        }}>
          {t('resumenPedido')}
        </p>
        {items.map(item => (
          <div key={item.productoId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)', flex: 1 }}>{item.nombre}</span>
            <span style={{ fontWeight: 700, fontSize: '0.75rem', background: 'var(--color-amber)', color: 'var(--color-brown)', borderRadius: '999px', padding: '2px 8px' }}>
              ×{item.q}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{formatPrecio(item.precio * item.q, idioma)}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(253,195,0,0.4)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-cream)' }}>{t('total')}</span>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal, idioma)}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,234,202,0.6)', marginTop: '1rem' }}>
          {t('coordinamosMetodo')}
        </p>
      </div>
    </section>
  )
}

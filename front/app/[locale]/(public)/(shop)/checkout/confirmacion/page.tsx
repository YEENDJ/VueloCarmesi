'use client'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLastOrder, setLastOrder } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import Button from '@/components/ui/Button'

export default function ConfirmacionPage() {
  const idioma = useLocale()

  const t = useTranslations('tienda.checkout')

  const router = useRouter()
  const lastOrder = useLastOrder()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !lastOrder) router.replace('/tienda')
  }, [hydrated, lastOrder, router])

  if (!hydrated || !lastOrder) return null

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        fontSize: '2.5rem', color: 'var(--color-brown)', fontWeight: 700,
      }}>
        ✓
      </div>
      <h1 style={{ color: 'var(--color-crimson)', margin: '1.5rem 0 0', fontSize: 'var(--fs-h1)' }}>{t('recibido')}</h1>
      <p style={{ color: 'var(--color-brown)', maxWidth: '44ch', margin: '1rem auto 0' }}>
        {t('recibidoTexto')}
      </p>

      <div style={{
        background: 'var(--color-cream)', border: '1px solid var(--color-amber)',
        borderRadius: '12px', padding: '2rem', margin: '2.5rem 0', textAlign: 'left',
      }}>
        <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-amber)' }}>
          Pedido {lastOrder.code}
        </p>
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1.25rem 0' }} />
        {lastOrder.items.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)', marginBottom: '0.6rem' }}>
            <span>{item.nombre} ×{item.q}</span>
            <span>{formatPrecio(item.subtotal, idioma)}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-brown)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-amber)' }}>{formatPrecio(lastOrder.total, idioma)}</span>
        </div>
      </div>

      <Button onClick={() => { setLastOrder(null); router.push('/tienda') }}>{t('volverTienda')}</Button>
    </section>
  )
}

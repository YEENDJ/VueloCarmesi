'use client'
import { useCart } from '@/lib/cart/store'
import { useTranslations, useLocale } from 'next-intl'
import { formatPrecio } from '@/lib/format'
import Button from '@/components/ui/Button'
import QuantitySelector from '@/components/ui/QuantitySelector'

export default function CarritoPage() {
  const idioma = useLocale()

  const tg = useTranslations('galeria')

  const t = useTranslations('tienda.carrito')

  const { items, cartCount, cartTotal, inc, dec, remove, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <section className="page-shell" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>{t('vacio')}</h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>{t('vacioTexto')}</p>
        <Button href="/tienda">{t('verTienda')}</Button>
      </section>
    )
  }

  return (
    <section className="page-shell shop-columns" style={{ maxWidth: '1000px' }}>
      <div className="shop-main">
        <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>{t('titulo')}</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(item => (
            <div key={item.productoId} className="cart-row">
              <div className="cart-row-media">
                <span style={{ fontSize: '1.75rem' }}>🍫</span>
              </div>
              <div className="cart-row-info">
                <p style={{ fontWeight: 700, color: 'var(--color-brown)' }}>{item.nombre}</p>
                <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>{formatPrecio(item.precio, idioma)} c/u</p>
              </div>
              <div className="cart-row-cantidad">
                <QuantitySelector
                  value={item.q}
                  onChange={next => next > item.q ? inc(item.productoId) : dec(item.productoId)}
                  min={1}
                  max={item.stock}
                />
              </div>
              <span className="cart-row-total">
                {formatPrecio(item.precio * item.q, idioma)}
              </span>
              <button
                onClick={() => remove(item.productoId)}
                className="cart-row-remove"
                aria-label={t('quitar', { nombre: item.nombre })}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Button href="/tienda" variant="outline">{tg('seguirComprando')}</Button>
          <button
            onClick={clearCart}
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
              color: 'rgba(135,43,19,0.7)', background: 'transparent',
              border: '1.5px solid rgba(135,43,19,0.25)', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer',
            }}
          >
            {t('vaciar')}
          </button>
        </div>
      </div>

      <div className="shop-aside" style={{
        background: 'var(--color-cream)', border: '1px solid rgba(135,43,19,0.15)',
        borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(135,43,19,0.16)',
      }}>
        <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-brown)', fontSize: 'var(--fs-h3)' }}>{t('resumen')}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)', marginBottom: '0.6rem' }}>
          <span>{t('subtotal', { n: cartCount })}</span>
          <span>{formatPrecio(cartTotal, idioma)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)' }}>
          <span>{t('envio')}</span>
          <span style={{ color: '#1F8A5B' }}>{t('aCoordinar')}</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-brown)' }}>{t('total')}</span>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal, idioma)}</span>
        </div>
        <Button href="/checkout" style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: '1.5rem' }}>
          {t('irCheckout')}
        </Button>
      </div>
    </section>
  )
}

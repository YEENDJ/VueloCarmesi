'use client'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart/store'

export default function CartBadge() {
  const tg = useTranslations('galeria')

  const { cartCount } = useCart()
  if (cartCount < 1) return null
  return (
    <Link
      href="/carrito"
      aria-label={tg('carrito', { n: cartCount })}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        color: 'var(--color-cream)', textDecoration: 'none',
      }}
    >
      <ShoppingCart size={22} />
      <span style={{
        position: 'absolute', top: '-8px', right: '-10px',
        background: 'var(--color-gold)', color: 'var(--color-brown)',
        borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
        padding: '1px 6px', minWidth: '18px', textAlign: 'center',
        lineHeight: '1.4',
      }}>
        {cartCount}
      </span>
    </Link>
  )
}

'use client'
import Link from 'next/link'
import { useCart } from '@/lib/cart/store'

export default function CartBadge() {
  const { cartCount } = useCart()
  return (
    <Link
      href="/carrito"
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '6px',
        color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 700,
      }}
    >
      🛒 Carrito
      {cartCount > 0 && (
        <span style={{
          background: 'var(--color-gold)', color: 'var(--color-brown)',
          borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
          padding: '2px 8px', minWidth: '20px', textAlign: 'center',
        }}>
          {cartCount}
        </span>
      )}
    </Link>
  )
}

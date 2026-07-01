'use client'
import Link from 'next/link'
import type { Producto } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useCart } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'

function badgeStyle(producto: Producto): { label: string; bg: string; fg: string } | null {
  if (producto.stock === 0) return { label: 'Agotado', bg: 'var(--color-brown)', fg: 'var(--color-cream)' }
  if (producto.badge === 'Nuevo') return { label: 'Nuevo', bg: 'var(--color-gold)', fg: 'var(--color-brown)' }
  if (producto.badge === 'Destacado') return { label: 'Destacado', bg: 'var(--color-crimson)', fg: 'var(--color-cream)' }
  return null
}

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { addToCart } = useCart()
  const badge = badgeStyle(producto)
  const agotado = producto.stock === 0

  return (
    <Card>
      <Link href={`/tienda/${producto.slug}`} style={{ position: 'relative', height: '200px', backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🍫</span>
        {badge && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px', fontWeight: 700, fontSize: '0.75rem',
            background: badge.bg, color: badge.fg, borderRadius: '999px', padding: '4px 10px',
          }}>
            {badge.label}
          </span>
        )}
      </Link>
      <div style={{ padding: '1.5rem' }}>
        <Link href={`/tienda/${producto.slug}`} style={{ textDecoration: 'none' }}>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-brown)' }}>{producto.nombre}</h3>
        </Link>
        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>{producto.descripcion}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-crimson)', fontSize: '1.2rem' }}>
            {formatPrecio(producto.precio)}
          </span>
          <Button onClick={() => addToCart(producto, 1)} variant="secondary" disabled={agotado}>
            {agotado ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

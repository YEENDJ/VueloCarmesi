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
      {/* aspect-ratio en vez de alto fijo: el marco sigue a la columna del grid y
          reserva el espacio antes de que cargue la foto, así la tarjeta no salta.
          Antes esto pintaba el emoji siempre e ignoraba producto.imagen, y por eso
          la tienda no mostraba ninguna foto aunque estuvieran cargadas. */}
      <Link href={`/tienda/${producto.slug}`} style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {producto.imagen
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', maxWidth: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>🍫</span>
        }
        {badge && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px', fontWeight: 700, fontSize: '0.75rem',
            background: badge.bg, color: badge.fg, borderRadius: '999px', padding: '4px 10px',
          }}>
            {badge.label}
          </span>
        )}
      </Link>
      <div style={{ padding: 'clamp(0.85rem, 3vw, 1.15rem)', minWidth: 0 }}>
        <Link href={`/tienda/${producto.slug}`} style={{ textDecoration: 'none' }}>
          <h3 className="producto-card-titulo" style={{ margin: '0 0 0.5rem', color: 'var(--color-brown)', minWidth: 0, fontSize: 'clamp(1rem, 2.2vw, 1.08rem)', overflowWrap: 'anywhere' }}>{producto.nombre}</h3>
        </Link>
        {/* title deja ver el texto completo al pasar el ratón, ya que se recorta */}
        {/* Mismo criterio que en las experiencias: la tarjeta no lleva párrafo,
            así todas alinean sin importar cuánto se escribió en cada ficha. El
            recorte a dos líneas dejaba de todos modos frases cortadas. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-crimson)', fontSize: 'clamp(1rem, 2.5vw, 1.12rem)', minWidth: 0 }}>
            {formatPrecio(producto.precio)}
          </span>
          {/* Compacto, no el tamaño por defecto: con la tarjeta a 266 px el botón
              ancho empujaba el precio a una línea aparte. inline-flex para que el
              rótulo siga centrado dentro del alto mínimo. */}
          <Button
            onClick={() => addToCart(producto, 1)}
            variant="secondary"
            disabled={agotado}
            className="btn-card"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 36, padding: '0.4rem 0.95rem', fontSize: '1rem',
            }}
          >
            {agotado ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

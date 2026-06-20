'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import type { Producto } from '@/lib/types'
import { getProductoBySlug } from '@/lib/api/productos'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useCarrito } from '@/lib/useCarrito'

export default function ProductoDetallePage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? ''
  const [producto, setProducto] = useState<Producto | null | undefined>(undefined)
  const { agregar } = useCarrito()

  useEffect(() => {
    getProductoBySlug(slug).then(p => setProducto(p))
  }, [slug])

  if (producto === undefined) {
    return (
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ opacity: 0.7 }}>Cargando...</p>
      </section>
    )
  }

  if (producto === null) notFound()

  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
      <div style={{ height: '400px', backgroundColor: 'var(--color-amber)', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '6rem' }}>🍫</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <Badge color="amber">{producto.categoria}</Badge>
        {producto.stock > 0
          ? <Badge color="orange">Stock: {producto.stock}</Badge>
          : <Badge color="crimson">Sin stock</Badge>
        }
      </div>
      <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>{producto.nombre}</h1>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2rem', opacity: 0.85 }}>{producto.descripcion}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-crimson)' }}>
          ${producto.precio.toLocaleString('es-AR')}
        </span>
        <Button onClick={() => agregar(producto)} disabled={producto.stock === 0}>
          Agregar al carrito
        </Button>
        <Button href="/carrito" variant="outline">Ver carrito</Button>
      </div>
    </section>
  )
}

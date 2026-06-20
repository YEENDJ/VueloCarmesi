'use client'
import type { Producto } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useCarrito } from '@/lib/useCarrito'

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito()

  return (
    <Card>
      <div style={{ height: '200px', backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🍫</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <Badge color="amber">{producto.categoria}</Badge>
        <h3 style={{ margin: '0.75rem 0 0.5rem', color: 'var(--color-brown)' }}>{producto.nombre}</h3>
        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>{producto.descripcion}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-crimson)', fontSize: '1.2rem' }}>
            ${producto.precio.toLocaleString('es-AR')}
          </span>
          <Button onClick={() => agregar(producto)} variant="secondary">Agregar</Button>
        </div>
      </div>
    </Card>
  )
}

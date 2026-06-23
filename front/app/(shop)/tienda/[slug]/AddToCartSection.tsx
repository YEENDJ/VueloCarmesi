'use client'
import { useState } from 'react'
import type { Producto } from '@/lib/types'
import { useCarrito } from '@/lib/useCarrito'
import QuantitySelector from '@/components/ui/QuantitySelector'
import Button from '@/components/ui/Button'

export default function AddToCartSection({ producto }: { producto: Producto }) {
  const [cantidad, setCantidad] = useState(1)
  const { agregar } = useCarrito()
  const sinStock = producto.stock === 0

  if (sinStock) {
    return (
      <div>
        <Button
          disabled
          style={{ display: 'block', textAlign: 'center', width: '100%' }}
        >
          Agregar al carrito
        </Button>
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--color-brown)', opacity: 0.6 }}>
          Sin stock disponible
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <QuantitySelector
          value={cantidad}
          onChange={setCantidad}
          min={1}
          max={producto.stock}
        />
      </div>
      <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--color-brown)', opacity: 0.6 }}>
        {producto.stock} unidades disponibles
      </p>
      <Button
        onClick={() => agregar(producto, cantidad)}
        style={{ display: 'block', textAlign: 'center', width: '100%' }}
      >
        Agregar al carrito
      </Button>
    </div>
  )
}

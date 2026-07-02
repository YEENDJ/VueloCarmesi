'use client'
import { useMemo, useState } from 'react'
import type { Producto } from '@/lib/types'
import ProductoCard from '@/components/shop/ProductoCard'

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function TiendaGrid({ productos }: { productos: Producto[] }) {
  const categorias = useMemo(() => {
    const unicas = Array.from(new Set(productos.map(p => p.categoria)))
    return ['Todos', ...unicas]
  }, [productos])

  const [filtro, setFiltro] = useState('Todos')

  const filtrados = useMemo(() => {
    if (filtro === 'Todos') return productos
    return productos.filter(p => p.categoria === filtro)
  }, [productos, filtro])

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categorias.map(cat => {
          const activo = cat === filtro
          return (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '999px', fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                border: activo ? 'none' : '1.5px solid var(--color-brown)',
                background: activo ? 'var(--color-crimson)' : 'transparent',
                color: activo ? 'var(--color-cream)' : 'var(--color-brown)',
              }}
            >
              {cat === 'Todos' ? cat : toTitleCase(cat)}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '2rem' }}>
        {filtrados.map(p => <ProductoCard key={p.id} producto={p} />)}
      </div>
    </>
  )
}

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

  // Sin productos no hay nada que filtrar: la barra de categorías sobra y solo
  // mostraría un "Todos" huérfano.
  if (productos.length === 0) {
    return (
      <p
        style={{
          border: '1.5px dashed var(--color-gold)',
          borderRadius: '12px',
          padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 32px)',
          textAlign: 'center',
          color: 'var(--color-brown)',
          fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
          lineHeight: 1.7,
          opacity: 0.75,
          minWidth: 0,
        }}
      >
        Aún no hay productos disponibles. Vuelve pronto.
      </p>
    )
  }

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
                // Ahora que el filtro es lo primero de la página, las píldoras son
                // el control principal: medían 35 px de alto, por debajo del mínimo
                // táctil.
                display: 'inline-flex', alignItems: 'center', minHeight: 44,
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
      <div className="tienda-grid">
        {filtrados.map(p => <ProductoCard key={p.id} producto={p} />)}
      </div>
    </>
  )
}

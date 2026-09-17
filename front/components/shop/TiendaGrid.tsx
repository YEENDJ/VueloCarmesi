'use client'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Producto } from '@/lib/types'
import ProductoCard from '@/components/shop/ProductoCard'

/**
 * El valor interno del filtro «todas las categorías».
 *
 * Es una constante y no la etiqueta traducida a propósito: la etiqueta cambia
 * con el idioma y la comparación no puede depender de ella, o en inglés el
 * filtro dejaría de reconocer su propio estado inicial.
 */
const TODOS = '__todos__'

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function TiendaGrid({ productos }: { productos: Producto[] }) {
  const t = useTranslations('tienda')

  const categorias = useMemo(() => {
    const unicas = Array.from(new Set(productos.map(p => p.categoria)))
    return [TODOS, ...unicas]
  }, [productos])

  const [filtro, setFiltro] = useState(TODOS)

  const filtrados = useMemo(() => {
    if (filtro === TODOS) return productos
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
        {t('catalogoVacio')}
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
              className="filtro-pill"
              style={{
                // Sólo lo que cambia con el estado: la forma y el alto viven en
                // .filtro-pill, que baja a 36 px con ratón y recupera los 44 del
                // mínimo táctil en pantallas de dedo.
                border: activo ? '1.5px solid transparent' : '1.5px solid var(--color-brown)',
                background: activo ? 'var(--color-crimson)' : 'transparent',
                color: activo ? 'var(--color-cream)' : 'var(--color-brown)',
              }}
            >
              {cat === TODOS ? t('todos') : toTitleCase(cat)}
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

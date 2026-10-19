import { describe, it, expect } from 'vitest'
import { sugerenciasCarrito } from './sugerencias-carrito'

const p = (id: string, categoria: string, precio: number, stock = 5, badge: 'Nuevo' | 'Destacado' | null = null) =>
  ({ id, categoria, precio, stock, badge })

describe('sugerenciasCarrito', () => {
  it('no sugiere lo que ya está en el carrito ni lo agotado', () => {
    const catalogo = [p('a', 'cafe', 10), p('b', 'cafe', 20, 0), p('c', 'cafe', 30)]
    const ids = sugerenciasCarrito(catalogo, [{ productoId: 'a' }]).map(x => x.id)
    expect(ids).toEqual(['c'])
  })

  it('pone primero la categoría de lo que lleva, luego destacados, luego el más barato', () => {
    const catalogo = [
      p('lleva', 'chocolates', 20),
      p('otro-caro', 'despensa', 90),
      p('otro-destacado', 'despensa', 50, 5, 'Destacado'),
      p('choco-caro', 'chocolates', 40),
      p('choco-barato', 'chocolates', 15),
    ]
    const ids = sugerenciasCarrito(catalogo, [{ productoId: 'lleva' }]).map(x => x.id)
    expect(ids).toEqual(['choco-barato', 'choco-caro', 'otro-destacado', 'otro-caro'])
  })

  it('pone primero los que tienen foto', () => {
    const catalogo = [{ ...p('sin-foto', 'x', 1), imagen: '' }, { ...p('con-foto', 'x', 50), imagen: 'a.jpg' }]
    expect(sugerenciasCarrito(catalogo, []).map(x => x.id)).toEqual(['con-foto', 'sin-foto'])
  })

  it('respeta el límite', () => {
    const catalogo = [p('a', 'x', 1), p('b', 'x', 2), p('c', 'x', 3)]
    expect(sugerenciasCarrito(catalogo, [], 2)).toHaveLength(2)
  })
})

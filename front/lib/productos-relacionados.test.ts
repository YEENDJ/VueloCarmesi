import { describe, it, expect } from 'vitest'
import { productosRelacionados } from './productos-relacionados'

const p = (slug: string, categoria: string, stock = 5) => ({ id: slug, slug, categoria, stock })

/** El catálogo de noviembre de 2026, en el orden en que lo entrega el backend. */
const CATALOGO = [
  p('aretes-de-mazorquitas-de-cacao', 'chocolates', 0),
  p('chucula-x-250-gramos', 'chocolates', 0),
  p('grageas-mujari-x-70-gramos', 'chocolates'),
  p('chocolate-instantaneo-en-polvo-x-250-gramos', 'chocolates', 0),
  p('chocolatina-carao-70-gramos', 'chocolates'),
  p('chocolatina-aricao-x-60-gramos', 'chocolates'),
  p('chocolate-aricao-x-125-gramos', 'chocolates'),
  p('chocolate-aricao-x-500-gramos', 'chocolates'),
  p('chocolate-aricao-x-250-gramos', 'chocolates'),
  p('miel-de-abejas-x-450-gramos', 'despensa'),
  p('coffee-rincon-x-250-gramos', 'cafe'),
  p('coffee-rincon-x-500-gramos', 'cafe'),
  p('mascarilla-de-cacao', 'regalos'),
]

const slugs = (lista: { slug: string }[]) => lista.map(x => x.slug)

describe('productosRelacionados', () => {
  it('no enlaza lo agotado ni a la ficha misma', () => {
    const catalogo = [p('a', 'cafe'), p('b', 'cafe', 0), p('c', 'cafe')]
    expect(slugs(productosRelacionados(catalogo, catalogo[0]))).toEqual(['c'])
  })

  it('pone primero la misma categoría y completa con las demás', () => {
    const cafe = CATALOGO.find(x => x.slug === 'coffee-rincon-x-250-gramos')!
    expect(slugs(productosRelacionados(CATALOGO, cafe))).toEqual([
      'coffee-rincon-x-500-gramos',
      'grageas-mujari-x-70-gramos',
      'mascarilla-de-cacao',
      'miel-de-abejas-x-450-gramos',
    ])
  })

  it('la ficha de un producto único en su categoría también enlaza', () => {
    const miel = CATALOGO.find(x => x.slug === 'miel-de-abejas-x-450-gramos')!
    expect(productosRelacionados(CATALOGO, miel)).toHaveLength(4)
  })

  it('desde una presentación ARICAO salen primero las otras presentaciones', () => {
    const aricao = CATALOGO.find(x => x.slug === 'chocolate-aricao-x-125-gramos')!
    expect(slugs(productosRelacionados(CATALOGO, aricao)).slice(0, 2)).toEqual([
      'chocolate-aricao-x-250-gramos',
      'chocolate-aricao-x-500-gramos',
    ])
  })

  it('una ficha agotada enlaza a productos disponibles', () => {
    const agotado = CATALOGO.find(x => x.slug === 'chucula-x-250-gramos')!
    const enlazados = productosRelacionados(CATALOGO, agotado)
    expect(enlazados).toHaveLength(4)
    expect(enlazados.every(x => x.stock > 0)).toBe(true)
  })

  it('todo producto disponible recibe enlaces y ninguno agotado', () => {
    const recibidos = new Map<string, number>()
    for (const ficha of CATALOGO) {
      for (const { slug } of productosRelacionados(CATALOGO, ficha)) {
        recibidos.set(slug, (recibidos.get(slug) ?? 0) + 1)
      }
    }
    for (const { slug, stock } of CATALOGO) {
      if (stock > 0) expect(recibidos.get(slug) ?? 0, slug).toBeGreaterThan(0)
      else expect(recibidos.has(slug), slug).toBe(false)
    }
  })

  it('un producto nuevo no cambia los enlaces de fichas lejanas en la lista', () => {
    const aricao = CATALOGO.find(x => x.slug === 'chocolate-aricao-x-125-gramos')!
    const antes = slugs(productosRelacionados(CATALOGO, aricao))
    const conNuevo = [p('zapote-x-100-gramos', 'despensa'), ...CATALOGO]
    expect(slugs(productosRelacionados(conNuevo, aricao))).toEqual(antes)
  })
})

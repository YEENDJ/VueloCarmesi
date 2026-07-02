import { describe, it, expect, beforeEach } from 'vitest'
import {
  addToCart, inc, dec, remove, clearCart, setLastOrder,
  getCartItems, getCartCount, getCartTotal, getToast, getLastOrder,
} from './store'
import type { Producto } from '@/lib/types'

function makeProducto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: 'p1', slug: 'chocolate-negro-70', nombre: 'Chocolate Negro 70%',
    descripcion: '', precio: 22000, stock: 5, imagen: '', categoria: 'chocolates',
    ...overrides,
  }
}

beforeEach(() => {
  clearCart()
  setLastOrder(null)
  localStorage.clear()
})

describe('addToCart', () => {
  it('agrega un producto nuevo con la cantidad indicada', () => {
    addToCart(makeProducto(), 2)
    expect(getCartItems()).toEqual([expect.objectContaining({ productoId: 'p1', q: 2 })])
  })

  it('suma la cantidad si el producto ya está en el carrito', () => {
    addToCart(makeProducto(), 1)
    addToCart(makeProducto(), 2)
    expect(getCartCount()).toBe(3)
  })

  it('no agrega productos agotados', () => {
    addToCart(makeProducto({ stock: 0 }), 1)
    expect(getCartItems()).toEqual([])
  })

  it('no supera el stock disponible', () => {
    addToCart(makeProducto({ stock: 3 }), 5)
    expect(getCartItems()[0].q).toBe(3)
  })

  it('dispara un toast singular', () => {
    addToCart(makeProducto({ nombre: 'Tableta 72% intenso' }), 1)
    expect(getToast()).toBe('Tableta 72% intenso agregado al carrito')
  })

  it('dispara un toast plural cuando qty > 1', () => {
    addToCart(makeProducto({ nombre: 'Tableta 72% intenso' }), 3)
    expect(getToast()).toBe('3 × Tableta 72% intenso agregados')
  })
})

describe('inc / dec', () => {
  it('inc suma 1 sin superar el stock', () => {
    addToCart(makeProducto({ stock: 2 }), 1)
    inc('p1')
    expect(getCartCount()).toBe(2)
    inc('p1')
    expect(getCartCount()).toBe(2)
  })

  it('dec nunca baja de 1', () => {
    addToCart(makeProducto(), 1)
    dec('p1')
    expect(getCartCount()).toBe(1)
  })
})

describe('remove / clearCart', () => {
  it('remove elimina la línea', () => {
    addToCart(makeProducto(), 1)
    remove('p1')
    expect(getCartItems()).toEqual([])
  })

  it('clearCart vacía el carrito', () => {
    addToCart(makeProducto({ id: 'p1' }), 1)
    addToCart(makeProducto({ id: 'p2' }), 1)
    clearCart()
    expect(getCartItems()).toEqual([])
    expect(getCartCount()).toBe(0)
  })
})

describe('cartTotal', () => {
  it('suma precio × cantidad de todas las líneas', () => {
    addToCart(makeProducto({ id: 'p1', precio: 1000, stock: 10 }), 2)
    addToCart(makeProducto({ id: 'p2', precio: 500, stock: 10 }), 3)
    expect(getCartTotal()).toBe(3500)
  })
})

describe('persistencia', () => {
  it('guarda el carrito en localStorage en cada mutación', () => {
    addToCart(makeProducto(), 2)
    const stored = JSON.parse(localStorage.getItem('vuelo-carmesi:carrito')!)
    expect(stored).toEqual([expect.objectContaining({ productoId: 'p1', q: 2 })])
  })
})

describe('lastOrder', () => {
  it('setLastOrder persiste y expone la última orden', () => {
    setLastOrder({ code: '#VC-ABC123', items: [{ nombre: 'X', q: 1, subtotal: 100 }], total: 100 })
    expect(getLastOrder()?.code).toBe('#VC-ABC123')
    const stored = JSON.parse(localStorage.getItem('vuelo-carmesi:ultimo-pedido')!)
    expect(stored.code).toBe('#VC-ABC123')
  })
})

import { useSyncExternalStore } from 'react'
import type { Producto } from '@/lib/types'

export interface CartItem {
  productoId: string
  slug: string
  nombre: string
  precio: number
  imagen: string
  stock: number
  q: number
}

export interface LastOrderItem {
  nombre: string
  q: number
  subtotal: number
}

export interface LastOrder {
  code: string
  items: LastOrderItem[]
  total: number
}

const CART_KEY = 'vuelo-carmesi:carrito'
const ORDER_KEY = 'vuelo-carmesi:ultimo-pedido'
const TOAST_DURATION_MS = 2000

let items: CartItem[] = []
/**
 * El aviso que se muestra al agregar al carrito.
 *
 * Guarda la CLAVE de traducción y sus datos, no la frase ya montada: este
 * módulo no es un componente y no puede llamar a `useTranslations`, así que si
 * armara el texto aquí saldría siempre en español —y así salía—. El componente
 * Toast, que sí está dentro del proveedor de i18n, lo traduce al pintarlo.
 */
export type AvisoCarrito = { clave: 'agregado' | 'agregados'; nombre: string; n: number }

let toast: AvisoCarrito | null = null
let lastOrder: LastOrder | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(listener => listener())
}

function isCartItem(value: unknown): value is CartItem {
  return (
    typeof value === 'object' && value !== null &&
    typeof (value as CartItem).productoId === 'string' &&
    typeof (value as CartItem).q === 'number'
  )
}

function persistCart() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function persistLastOrder() {
  if (typeof window === 'undefined') return
  if (lastOrder) window.localStorage.setItem(ORDER_KEY, JSON.stringify(lastOrder))
  else window.localStorage.removeItem(ORDER_KEY)
}

function hydrate() {
  if (typeof window === 'undefined') return
  try {
    const rawCart = window.localStorage.getItem(CART_KEY)
    const parsedCart = rawCart ? JSON.parse(rawCart) : []
    items = Array.isArray(parsedCart) && parsedCart.every(isCartItem) ? parsedCart : []
  } catch {
    items = []
  }
  try {
    const rawOrder = window.localStorage.getItem(ORDER_KEY)
    lastOrder = rawOrder ? JSON.parse(rawOrder) : null
  } catch {
    lastOrder = null
  }
}

hydrate()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === CART_KEY) {
      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : []
        items = Array.isArray(parsed) && parsed.every(isCartItem) ? parsed : []
        emit()
      } catch { /* ignora escritura externa malformada */ }
    }
    if (event.key === ORDER_KEY) {
      try {
        lastOrder = event.newValue ? JSON.parse(event.newValue) : null
        emit()
      } catch { /* ignora escritura externa malformada */ }
    }
  })
}

function showToast(aviso: AvisoCarrito) {
  toast = aviso
  emit()
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast = null
    emit()
  }, TOAST_DURATION_MS)
}

/**
 * Tope por producto: el de `MAX_CANTIDAD_POR_PRODUCTO` en create-pedido.dto.ts.
 * Más que eso es venta al por mayor y el backend rechaza el pedido.
 */
export const MAX_POR_PRODUCTO = 99

const tope = (stock: number) => Math.min(stock, MAX_POR_PRODUCTO)

export function addToCart(producto: Producto, qty = 1): void {
  if (producto.stock === 0) return
  const existing = items.find(item => item.productoId === producto.id)
  if (existing) {
    const nextQ = Math.min(existing.q + qty, tope(producto.stock))
    items = items.map(item => item.productoId === producto.id ? { ...item, q: nextQ } : item)
  } else {
    items = [...items, {
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagenes?.[0] ?? producto.imagen,
      stock: producto.stock,
      q: Math.min(qty, tope(producto.stock)),
    }]
  }
  persistCart()
  showToast({
    clave: qty > 1 ? 'agregados' : 'agregado',
    nombre: producto.nombre,
    n: qty,
  })
  emit()
}

export function inc(productoId: string): void {
  items = items.map(item =>
    item.productoId === productoId ? { ...item, q: Math.min(item.q + 1, tope(item.stock)) } : item
  )
  persistCart()
  emit()
}

export function dec(productoId: string): void {
  items = items.map(item =>
    item.productoId === productoId ? { ...item, q: Math.max(1, item.q - 1) } : item
  )
  persistCart()
  emit()
}

export function remove(productoId: string): void {
  items = items.filter(item => item.productoId !== productoId)
  persistCart()
  emit()
}

export function clearCart(): void {
  items = []
  persistCart()
  emit()
}

export function setLastOrder(order: LastOrder | null): void {
  lastOrder = order
  persistLastOrder()
  emit()
}

export function getCartItems(): CartItem[] { return items }
export function getCartCount(): number { return items.reduce((sum, item) => sum + item.q, 0) }
export function getCartTotal(): number { return items.reduce((sum, item) => sum + item.precio * item.q, 0) }
export function getToast(): AvisoCarrito | null { return toast }
export function getLastOrder(): LastOrder | null { return lastOrder }

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const EMPTY_ITEMS: CartItem[] = []
function getServerItems() { return EMPTY_ITEMS }
function getServerToast(): AvisoCarrito | null {
  return null
}
function getServerLastOrder() { return null }

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getCartItems, getServerItems)
  const cartCount = snapshot.reduce((sum, item) => sum + item.q, 0)
  const cartTotal = snapshot.reduce((sum, item) => sum + item.precio * item.q, 0)
  return { items: snapshot, cartCount, cartTotal, addToCart, inc, dec, remove, clearCart }
}

export function useToast(): AvisoCarrito | null {
  return useSyncExternalStore(subscribe, getToast, getServerToast)
}

export function useLastOrder(): LastOrder | null {
  return useSyncExternalStore(subscribe, getLastOrder, getServerLastOrder)
}

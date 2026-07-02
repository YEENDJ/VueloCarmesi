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
let toast = ''
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

function showToast(message: string) {
  toast = message
  emit()
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast = ''
    emit()
  }, TOAST_DURATION_MS)
}

export function addToCart(producto: Producto, qty = 1): void {
  if (producto.stock === 0) return
  const existing = items.find(item => item.productoId === producto.id)
  if (existing) {
    const nextQ = Math.min(existing.q + qty, producto.stock)
    items = items.map(item => item.productoId === producto.id ? { ...item, q: nextQ } : item)
  } else {
    items = [...items, {
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.images?.[0] ?? producto.imagen,
      stock: producto.stock,
      q: Math.min(qty, producto.stock),
    }]
  }
  persistCart()
  showToast(qty > 1 ? `${qty} × ${producto.nombre} agregados` : `${producto.nombre} agregado al carrito`)
  emit()
}

export function inc(productoId: string): void {
  items = items.map(item =>
    item.productoId === productoId ? { ...item, q: Math.min(item.q + 1, item.stock) } : item
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
export function getToast(): string { return toast }
export function getLastOrder(): LastOrder | null { return lastOrder }

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const EMPTY_ITEMS: CartItem[] = []
function getServerItems() { return EMPTY_ITEMS }
function getServerToast() { return '' }
function getServerLastOrder() { return null }

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getCartItems, getServerItems)
  const cartCount = snapshot.reduce((sum, item) => sum + item.q, 0)
  const cartTotal = snapshot.reduce((sum, item) => sum + item.precio * item.q, 0)
  return { items: snapshot, cartCount, cartTotal, addToCart, inc, dec, remove, clearCart }
}

export function useToast(): string {
  return useSyncExternalStore(subscribe, getToast, getServerToast)
}

export function useLastOrder(): LastOrder | null {
  return useSyncExternalStore(subscribe, getLastOrder, getServerLastOrder)
}

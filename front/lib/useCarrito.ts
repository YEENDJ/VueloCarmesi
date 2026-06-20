'use client'
import { useState, useEffect } from 'react'
import type { ItemCarrito, Producto } from '@/lib/types'

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('carrito')
    if (stored) setItems(JSON.parse(stored))
  }, [])

  const guardar = (nuevos: ItemCarrito[]) => {
    setItems(nuevos)
    localStorage.setItem('carrito', JSON.stringify(nuevos))
  }

  const agregar = (producto: Producto) => {
    const existente = items.find(i => i.producto.id === producto.id)
    if (existente) {
      guardar(items.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      guardar([...items, { producto, cantidad: 1 }])
    }
  }

  const quitar = (productoId: string) => guardar(items.filter(i => i.producto.id !== productoId))

  const total = items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)

  return { items, agregar, quitar, total }
}

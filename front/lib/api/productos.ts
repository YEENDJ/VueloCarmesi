import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_PRODUCTOS: Producto[] = [
  { id: '1', slug: 'cacao-en-polvo-500g', nombre: 'Cacao en Polvo 500g', descripcion: 'Cacao puro sin azúcar, ideal para recetas.', precio: 2800, stock: 50, imagen: '', categoria: 'cacao' },
  { id: '2', slug: 'chocolate-oscuro-70', nombre: 'Chocolate Oscuro 70%', descripcion: 'Tableta artesanal 100g.', precio: 1500, stock: 30, imagen: '', categoria: 'chocolate' },
  { id: '3', slug: 'nibs-de-cacao', nombre: 'Nibs de Cacao', descripcion: 'Trozos crujientes de cacao tostado, 200g.', precio: 1800, stock: 40, imagen: '', categoria: 'cacao' },
]

export async function getProductos(): Promise<Producto[]> {
  try {
    const res = await fetch(`${BASE}/productos`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_PRODUCTOS
  }
}

export async function getProductoBySlug(slug: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${BASE}/productos/slug/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_PRODUCTOS.find(p => p.slug === slug) ?? null
  }
}

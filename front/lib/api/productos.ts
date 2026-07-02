import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: '1',
    slug: 'chocolate-negro-70',
    nombre: 'Chocolate Negro 70%',
    descripcion: 'Tableta 80 g con cacao fino de aroma del Huila. Notas a frutos rojos y panela. Sin lecitina ni saborizantes.',
    precio: 22000,
    stock: 40,
    imagen: '',
    categoria: 'chocolates',
    badge: 'Destacado',
    images: ['https://placehold.co/800x600/872b13/ffeaca?text=Chocolate+70'],
  },
  {
    id: '2',
    slug: 'nibs-de-cacao',
    nombre: 'Nibs de Cacao Tostado',
    descripcion: 'Trozos de cacao fermentado y tostado, sin azúcar. 150 g. Ideal para yogur, ensaladas o snack.',
    precio: 18000,
    stock: 20,
    imagen: '',
    categoria: 'despensa',
    badge: 'Nuevo',
    images: ['https://placehold.co/800x600/ea5b0c/ffeaca?text=Nibs+Cacao'],
  },
  {
    id: '3',
    slug: 'cafe-especial-finca',
    nombre: 'Café Especial de la Finca',
    descripcion: 'Arábica lavado, proceso honey. Tostión media. 250 g molido o en grano. Puntuación SCA 84.',
    precio: 32000,
    stock: 22,
    imagen: '',
    categoria: 'cafe',
    images: ['https://placehold.co/800x600/f59c00/ffeaca?text=Cafe+Especial'],
  },
  {
    id: '4',
    slug: 'kit-regalo-carmesi',
    nombre: 'Kit Regalo Vuelo Carmesí',
    descripcion: 'Caja de madera artesanal con tableta negra, tableta de leche, nibs y café especial.',
    precio: 88000,
    stock: 0,
    imagen: '',
    categoria: 'regalos',
    images: ['https://placehold.co/800x600/d51312/ffeaca?text=Kit+Regalo'],
  },
]

export async function getProductos(): Promise<Producto[]> {
  try {
    const res = await fetch(`${BASE}/productos`, { next: { revalidate: 60, tags: ['productos'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_PRODUCTOS
  }
}

export async function getProductoBySlug(slug: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${BASE}/productos/slug/${slug}`, { next: { revalidate: 60, tags: ['productos'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_PRODUCTOS.find(p => p.slug === slug) ?? null
  }
}

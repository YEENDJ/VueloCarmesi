import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: '1',
    slug: 'cacao-en-polvo-500g',
    nombre: 'Cacao en Polvo 500g',
    descripcion: 'Cacao puro sin azúcar, ideal para recetas de repostería y bebidas calientes. Sin aditivos, sin gluten.',
    precio: 2800,
    stock: 50,
    imagen: '',
    categoria: 'cacao',
    images: [
      'https://placehold.co/800x800/ffeaca/872b13?text=Cacao+Polvo+1',
      'https://placehold.co/800x800/f59c00/872b13?text=Cacao+Polvo+2',
      'https://placehold.co/800x800/d51312/ffeaca?text=Cacao+Polvo+3',
      'https://placehold.co/800x800/ea5b0c/ffeaca?text=Cacao+Polvo+4',
    ],
  },
  {
    id: '2',
    slug: 'chocolate-oscuro-70',
    nombre: 'Chocolate Oscuro 70%',
    descripcion: 'Tableta artesanal de 100g. Alto contenido de cacao, sin azúcar añadida. Origen único, cosecha del año.',
    precio: 1500,
    stock: 30,
    imagen: '',
    categoria: 'chocolate',
    images: [
      'https://placehold.co/800x800/ffeaca/872b13?text=Chocolate+1',
      'https://placehold.co/800x800/872b13/ffeaca?text=Chocolate+2',
      'https://placehold.co/800x800/d51312/ffeaca?text=Chocolate+3',
      'https://placehold.co/800x800/fdc300/872b13?text=Chocolate+4',
    ],
  },
  {
    id: '3',
    slug: 'nibs-de-cacao',
    nombre: 'Nibs de Cacao',
    descripcion: 'Trozos crujientes de cacao tostado, 200g. Perfectos para agregar a granolas, smoothies y postres.',
    precio: 1800,
    stock: 40,
    imagen: '',
    categoria: 'cacao',
    images: [
      'https://placehold.co/800x800/ffeaca/872b13?text=Nibs+1',
      'https://placehold.co/800x800/f59c00/872b13?text=Nibs+2',
      'https://placehold.co/800x800/ea5b0c/ffeaca?text=Nibs+3',
      'https://placehold.co/800x800/872b13/ffeaca?text=Nibs+4',
    ],
  },
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

import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const CACHE: RequestInit = { next: { revalidate: 60, tags: ['productos'] } }

// Los mocks son andamio de desarrollo: permiten levantar el front sin backend.
// En producción no se usan nunca — servir catálogo inventado, o un 404 porque el
// slug real no figura en esta lista, es lo que dejaba productos inaccesibles.
const USAR_MOCKS = process.env.NODE_ENV !== 'production'

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
    const res = await fetch(`${BASE}/productos`, CACHE)
    if (!res.ok) throw new Error(`GET /productos respondió ${res.status}`)
    return res.json()
  } catch (err) {
    if (USAR_MOCKS) return MOCK_PRODUCTOS
    console.error('[productos] no se pudo cargar el catálogo:', err)
    return []
  }
}

export async function getProductoBySlug(slug: string): Promise<Producto | null> {
  let res: Response
  try {
    // El slug NO se codifica: Next entrega params.slug tal cual viene en la ruta,
    // es decir ya percent-encoded. Aplicarle encodeURIComponent lo codifica dos
    // veces y el backend no encuentra nada (los slugs con espacios daban 404).
    res = await fetch(`${BASE}/productos/slug/${slug}`, CACHE)
  } catch (err) {
    // Sin backend alcanzable: en desarrollo caemos a los mocks, pero en producción
    // propagamos. Devolver null aquí haría que la página llame a notFound() y Next
    // cachee un 404 para un producto que sí existe.
    if (USAR_MOCKS) return MOCK_PRODUCTOS.find(p => p.slug === slug) ?? null
    throw err
  }
  if (res.status === 404) return null // el único caso en que el producto no existe
  if (!res.ok) throw new Error(`GET /productos/slug/${slug} respondió ${res.status}`)
  return res.json()
}

import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const CACHE: RequestInit = { next: { revalidate: 60, tags: ['productos'] } }

/** Ver lib/api/experiencias.ts: el español es el original y no lleva parámetro. */
const conIdioma = (url: string, idioma: string) =>
  idioma === 'es' ? url : `${url}${url.includes('?') ? '&' : '?'}idioma=${idioma}`

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
    imagen: '/images/cacao/bodegon-granos.jpg',
    categoria: 'chocolates',
    badge: 'Destacado',
    imagenes: ['/images/cacao/bodegon-granos.jpg', '/images/cacao/granos-mano.jpg'],
  },
  {
    id: '2',
    slug: 'nibs-de-cacao',
    nombre: 'Nibs de Cacao Tostado',
    descripcion: 'Trozos de cacao fermentado y tostado, sin azúcar. 150 g. Ideal para yogur, ensaladas o snack.',
    precio: 18000,
    stock: 20,
    imagen: '/images/cacao/granos-mano.jpg',
    categoria: 'despensa',
    badge: 'Nuevo',
    imagenes: ['/images/cacao/granos-mano.jpg'],
  },
  {
    id: '3',
    slug: 'cafe-especial-finca',
    nombre: 'Café Especial de la Finca',
    descripcion: 'Arábica lavado, proceso honey. Tostión media. 250 g molido o en grano. Puntuación SCA 84.',
    precio: 32000,
    stock: 22,
    imagen: '/images/cacao/mazorca-abierta.jpg',
    categoria: 'cafe',
    imagenes: ['/images/cacao/mazorca-abierta.jpg'],
  },
  {
    id: '4',
    slug: 'kit-regalo-carmesi',
    nombre: 'Kit Regalo Vuelo Carmesí',
    descripcion: 'Caja de madera artesanal con tableta negra, tableta de leche, nibs y café especial.',
    precio: 88000,
    stock: 0,
    imagen: '/images/experiencias/chocoterapia.jpg',
    categoria: 'regalos',
    imagenes: ['/images/experiencias/chocoterapia.jpg'],
  },
]

export async function getProductos(idioma = 'es'): Promise<Producto[]> {
  try {
    const res = await fetch(conIdioma(`${BASE}/productos`, idioma), CACHE)
    if (!res.ok) throw new Error(`GET /productos respondió ${res.status}`)
    return res.json()
  } catch (err) {
    if (USAR_MOCKS) return MOCK_PRODUCTOS
    console.error('[productos] no se pudo cargar el catálogo:', err)
    return []
  }
}

export async function getProductoBySlug(
  slug: string,
  idioma = 'es',
): Promise<Producto | null> {
  let res: Response
  try {
    // El slug NO se codifica: Next entrega params.slug tal cual viene en la ruta,
    // es decir ya percent-encoded. Aplicarle encodeURIComponent lo codifica dos
    // veces y el backend no encuentra nada (los slugs con espacios daban 404).
    res = await fetch(conIdioma(`${BASE}/productos/slug/${slug}`, idioma), CACHE)
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

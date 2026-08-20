import type { Experiencia } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const CACHE: RequestInit = { next: { revalidate: 60, tags: ['experiencias'] } }

// Los mocks son andamio de desarrollo: permiten levantar el front sin backend.
// En producción no se usan nunca — servir catálogo inventado, o un 404 porque el
// slug real no figura en esta lista, es lo que dejaba experiencias inaccesibles.
const USAR_MOCKS = process.env.NODE_ENV !== 'production'

export const MOCK_EXPERIENCIAS: Experiencia[] = [
  {
    id: '1',
    slug: 'ruta-del-cacao',
    nombre: 'Ruta del Cacao',
    descripcion: 'Recorre el ciclo completo del cacao: desde la mazorca abierta en el árbol hasta la tableta terminada. Fermentación, secado y degustación guiada por los productores de la finca.',
    duracion: '3 horas',
    precio: 95000,
    capacidad: 12,
    imagen: '/images/cacao/mazorca-abierta.jpg',
    destacada: true,
    images: [
      '/images/cacao/mazorca-abierta.jpg',
      '/images/experiencias/paso-3.jpg',
    ],
    incluye: ['Guía especializado', 'Degustación de variedades de cacao', 'Tableta de chocolate para llevar'],
    queTraer: ['Ropa cómoda', 'Calzado cerrado', 'Protector solar'],
  },
  {
    id: '2',
    slug: 'madrugada-cafetera',
    nombre: 'Madrugada Cafetera',
    descripcion: 'Madrugar nunca fue tan placentero. Acompaña a los recolectores al amanecer, aprende a seleccionar el grano maduro y cierra con una taza en V60.',
    duracion: '2.5 horas',
    precio: 75000,
    capacidad: 8,
    imagen: '/images/lugar/selva.jpg',
    destacada: true,
    images: [
      '/images/lugar/selva.jpg',
      '/images/experiencias/refrigerio.jpg',
    ],
    incluye: ['Guía cafetero', 'Taza de café cosechado por ti', 'Desayuno ligero'],
    queTraer: ['Abrigo', 'Linterna', 'Ropa cómoda'],
  },
  {
    id: '3',
    slug: 'taller-chocolate-artesanal',
    nombre: 'Taller de Chocolate Artesanal',
    descripcion: 'Aprende a templar, moldear y personalizar tus propias tabletas de chocolate. Te llevas lo que haces.',
    duracion: '2 horas',
    precio: 85000,
    capacidad: 10,
    imagen: '/images/experiencias/chocoterapia.jpg',
    destacada: false,
    images: [
      '/images/experiencias/chocoterapia.jpg',
      '/images/cacao/bodegon-granos.jpg',
    ],
    incluye: ['Todos los materiales', 'Tableta artesanal para llevar (100g)', 'Certificado de participación'],
    queTraer: ['Ropa que pueda mancharse', 'Ganas de crear'],
  },
]

export async function getExperiencias(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias`, CACHE)
    if (!res.ok) throw new Error(`GET /experiencias respondió ${res.status}`)
    return res.json()
  } catch (err) {
    if (USAR_MOCKS) return MOCK_EXPERIENCIAS
    console.error('[experiencias] no se pudo cargar el catálogo:', err)
    return []
  }
}

export async function getExperienciasDestacadas(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias?destacadas=true`, CACHE)
    if (!res.ok) throw new Error(`GET /experiencias?destacadas respondió ${res.status}`)
    return res.json()
  } catch (err) {
    if (USAR_MOCKS) return MOCK_EXPERIENCIAS.filter(e => e.destacada)
    console.error('[experiencias] no se pudieron cargar las destacadas:', err)
    return []
  }
}

export async function getExperienciaBySlug(slug: string): Promise<Experiencia | null> {
  let res: Response
  try {
    // El slug NO se codifica: Next entrega params.slug tal cual viene en la ruta,
    // es decir ya percent-encoded. Aplicarle encodeURIComponent lo codifica dos
    // veces y el backend no encuentra nada (los slugs con espacios daban 404).
    res = await fetch(`${BASE}/experiencias/slug/${slug}`, CACHE)
  } catch (err) {
    // Sin backend alcanzable: en desarrollo caemos a los mocks, pero en producción
    // propagamos. Devolver null aquí haría que la página llame a notFound() y Next
    // cachee un 404 para una experiencia que sí existe.
    if (USAR_MOCKS) return MOCK_EXPERIENCIAS.find(e => e.slug === slug) ?? null
    throw err
  }
  if (res.status === 404) return null // el único caso en que la experiencia no existe
  if (!res.ok) throw new Error(`GET /experiencias/slug/${slug} respondió ${res.status}`)
  return res.json()
}

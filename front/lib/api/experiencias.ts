import type { Experiencia } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_EXPERIENCIAS: Experiencia[] = [
  {
    id: '1',
    slug: 'ruta-del-cacao',
    nombre: 'Ruta del Cacao',
    descripcion: 'Recorre el ciclo completo del cacao: desde la mazorca abierta en el árbol hasta la tableta terminada. Fermentación, secado y degustación guiada por los productores de la finca.',
    duracion: '3 horas',
    precio: 95000,
    capacidad: 12,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Ruta+del+Cacao',
      'https://placehold.co/800x600/872b13/ffeaca?text=Ruta+del+Cacao+2',
    ],
    incluye: ['Guía especializado', 'Degustación de variedades de cacao', 'Tableta de chocolate para llevar'],
    queTraer: ['Ropa cómoda', 'Calzado cerrado', 'Protector solar'],
  },
  {
    id: '2',
    slug: 'madrugada-cafetera',
    nombre: 'Madrugada Cafetera',
    descripcion: 'Madrugar nunca fue tan placentero. Acompañá a los recolectores al amanecer, aprendé a seleccionar el grano maduro y cerrá con una taza en V60.',
    duracion: '2.5 horas',
    precio: 75000,
    capacidad: 8,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Madrugada+Cafetera',
      'https://placehold.co/800x600/872b13/ffeaca?text=Madrugada+Cafetera+2',
    ],
    incluye: ['Guía cafetero', 'Taza de café cosechado por vos', 'Desayuno ligero'],
    queTraer: ['Abrigo', 'Linterna', 'Ropa cómoda'],
  },
  {
    id: '3',
    slug: 'taller-chocolate-artesanal',
    nombre: 'Taller de Chocolate Artesanal',
    descripcion: 'Aprendé a templar, moldear y personalizar tus propias tabletas de chocolate. Te llevás lo que hacés.',
    duracion: '2 horas',
    precio: 85000,
    capacidad: 10,
    imagen: '',
    destacada: false,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Taller+Chocolate',
      'https://placehold.co/800x600/872b13/ffeaca?text=Taller+Chocolate+2',
    ],
    incluye: ['Todos los materiales', 'Tableta artesanal para llevar (100g)', 'Certificado de participación'],
    queTraer: ['Ropa que pueda mancharse', 'Ganas de crear'],
  },
]

export async function getExperiencias(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias`, { next: { revalidate: 60, tags: ['experiencias'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS
  }
}

export async function getExperienciaBySlug(slug: string): Promise<Experiencia | null> {
  try {
    const res = await fetch(`${BASE}/experiencias/slug/${slug}`, { next: { revalidate: 60, tags: ['experiencias'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS.find(e => e.slug === slug) ?? null
  }
}

export async function getExperienciasDestacadas(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias?destacadas=true`, { next: { revalidate: 60, tags: ['experiencias'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS.filter(e => e.destacada)
  }
}

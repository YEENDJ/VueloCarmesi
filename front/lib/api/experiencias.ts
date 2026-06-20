import type { Experiencia } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_EXPERIENCIAS: Experiencia[] = [
  { id: '1', slug: 'cacao-intenso', nombre: 'Cacao Intenso', descripcion: 'Recorrido por plantaciones y degustación guiada de variedades de cacao.', duracion: '4 horas', precio: 8500, capacidad: 12, imagen: '', destacada: true },
  { id: '2', slug: 'cacao-y-arte', nombre: 'Cacao & Arte', descripcion: 'Taller de chocolatería artesanal con artistas locales.', duracion: '3 horas', precio: 7000, capacidad: 8, imagen: '', destacada: false },
  { id: '3', slug: 'amanecer-agroecologico', nombre: 'Amanecer Agroecológico', descripcion: 'Tour al amanecer con desayuno orgánico incluido.', duracion: '5 horas', precio: 9500, capacidad: 10, imagen: '', destacada: true },
]

export async function getExperiencias(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS
  }
}

export async function getExperienciaBySlug(slug: string): Promise<Experiencia | null> {
  try {
    const res = await fetch(`${BASE}/experiencias/slug/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS.find(e => e.slug === slug) ?? null
  }
}

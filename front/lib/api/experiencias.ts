import type { Experiencia } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_EXPERIENCIAS: Experiencia[] = [
  {
    id: '1',
    slug: 'cacao-intenso',
    nombre: 'Cacao Intenso',
    descripcion: 'Recorrido por plantaciones y degustación guiada de variedades de cacao. Conocé de primera mano el origen del chocolate artesanal junto a productores locales.',
    duracion: '4 horas',
    precio: 8500,
    capacidad: 12,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Cacao+Intenso+1',
      'https://placehold.co/800x600/872b13/ffeaca?text=Cacao+Intenso+2',
      'https://placehold.co/800x600/ea5b0c/ffeaca?text=Cacao+Intenso+3',
      'https://placehold.co/800x600/f59c00/ffeaca?text=Cacao+Intenso+4',
    ],
    incluye: ['Guía bilingüe especializado', 'Degustación de 6 variedades de cacao', 'Traslado ida y vuelta', 'Cuaderno de cata'],
    queTraer: ['Ropa cómoda', 'Calzado cerrado', 'Protector solar', 'Cámara de fotos'],
  },
  {
    id: '2',
    slug: 'cacao-y-arte',
    nombre: 'Cacao & Arte',
    descripcion: 'Taller de chocolatería artesanal con artistas locales. Creá tu propia tableta de chocolate y aprendé técnicas de decoración.',
    duracion: '3 horas',
    precio: 7000,
    capacidad: 8,
    imagen: '',
    destacada: false,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Cacao+Arte+1',
      'https://placehold.co/800x600/872b13/ffeaca?text=Cacao+Arte+2',
      'https://placehold.co/800x600/ea5b0c/ffeaca?text=Cacao+Arte+3',
      'https://placehold.co/800x600/f59c00/ffeaca?text=Cacao+Arte+4',
    ],
    incluye: ['Todos los materiales del taller', 'Chocolate artesanal para llevar (300g)', 'Certificado de participación'],
    queTraer: ['Ropa que pueda mancharse', 'Ganas de crear'],
  },
  {
    id: '3',
    slug: 'amanecer-agroecologico',
    nombre: 'Amanecer Agroecológico',
    descripcion: 'Tour al amanecer con desayuno orgánico incluido. Viví la magia de la cosecha con los primeros rayos del sol.',
    duracion: '5 horas',
    precio: 9500,
    capacidad: 10,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Amanecer+1',
      'https://placehold.co/800x600/872b13/ffeaca?text=Amanecer+2',
      'https://placehold.co/800x600/ea5b0c/ffeaca?text=Amanecer+3',
      'https://placehold.co/800x600/f59c00/ffeaca?text=Amanecer+4',
    ],
    incluye: ['Desayuno orgánico completo', 'Guía agroecológico certificado', 'Transporte al punto de partida'],
    queTraer: ['Abrigo (madrugada fría)', 'Linterna', 'Ropa cómoda'],
  },
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

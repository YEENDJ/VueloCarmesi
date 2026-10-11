import type { Ave } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const CACHE: RequestInit = { next: { revalidate: 60, tags: ['aves'] } }

/** Ver lib/api/productos.ts: los mocks solo sirven para levantar el front sin backend. */
const USAR_MOCKS = process.env.NODE_ENV !== 'production'

/**
 * Las especies que había escritas a mano en la página antes del panel. Son las
 * mismas que siembra la migración `20261010000000_aves`.
 */
export const MOCK_AVES: Ave[] = [
  { id: 'ave_aracari', cientifico: 'Pteroglossus castanotis', ingles: 'Chestnut-eared Aracari', local: 'Pichí de collar', tipo: 'residente', imagen: '/images/aves/aracari.jpg', foco: '31% 50%', alt: 'Pichí de collar posado en una rama, con el pecho amarillo y la banda roja', orden: 1 },
  { id: 'ave_carpintero', cientifico: 'Campephilus melanoleucos', ingles: 'Crimson-crested Woodpecker', local: 'Carpintero real', tipo: 'residente', imagen: '/images/aves/carpintero.jpg', foco: '55% 50%', alt: 'Carpintero real de cresta carmesí trepado en el tronco de un árbol', orden: 2 },
  { id: 'ave_currucutu', cientifico: 'Glaucidium brasilianum', ingles: 'Ferruginous Pygmy-Owl', local: 'Currucutú común', tipo: 'residente', imagen: '/images/aves/currucutu.jpg', foco: '73% 50%', alt: 'Currucutú de ojos amarillos mirando de frente a la cámara', orden: 3 },
  { id: 'ave_tigana', cientifico: 'Eurypyga helias', ingles: 'Sunbittern', local: 'Tigana', tipo: 'residente', imagen: '/images/aves/tigana.jpg', foco: '50% 50%', alt: 'Tigana caminando entre la hierba a la orilla del agua', orden: 4 },
  { id: 'ave_carriqui', cientifico: 'Cyanocorax violaceus', ingles: 'Violaceous Jay', local: 'Carriquí violáceo', tipo: 'residente', imagen: '/images/aves/carriqui.jpg', foco: '8% 50%', alt: 'Carriquí violáceo posado entre el follaje', orden: 5 },
  { id: 'ave_azulejo', cientifico: 'Thraupis palmarum', ingles: 'Palm Tanager', local: 'Azulejo palmero', tipo: 'residente', imagen: '/images/aves/azulejo-palmero.jpg', foco: '36% 50%', alt: 'Azulejo palmero sobre una rama con el plumaje verde oliva', orden: 6 },
  { id: 'ave_tangara', cientifico: 'Cissopis leverianus', ingles: 'Magpie Tanager', local: 'Tangara urraca', tipo: 'residente', imagen: '/images/aves/tangara-urraca.jpg', foco: '50% 26%', alt: 'Tángara urraca en blanco y negro posada en una rama', orden: 7 },
  { id: 'ave_piranga', cientifico: 'Piranga rubra', ingles: 'Summer Tanager', local: 'Piranga roja', tipo: 'migratoria', imagen: '', foco: '50% 50%', alt: '', orden: 1 },
  { id: 'ave_candelita', cientifico: 'Setophaga ruticilla', ingles: 'American Redstart', local: 'Candelita norteña', tipo: 'migratoria', imagen: '', foco: '50% 50%', alt: '', orden: 2 },
]

/** Ya ordenadas: residentes primero y cada grupo por `orden`. */
export async function getAves(idioma = 'es'): Promise<Ave[]> {
  try {
    const res = await fetch(`${BASE}/aves?idioma=${idioma}`, CACHE)
    if (!res.ok) throw new Error(`GET /aves respondió ${res.status}`)
    return res.json()
  } catch (err) {
    if (USAR_MOCKS) return MOCK_AVES
    console.error('[aves] no se pudo cargar la lista:', err)
    return []
  }
}

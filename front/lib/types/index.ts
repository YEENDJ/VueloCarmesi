export interface Experiencia {
  id: string
  slug: string
  nombre: string
  /** Meta description de Google (≤160). Vacía = se deriva de la larga. */
  descripcion: string
  /** El relato de la ficha, en párrafos. Es el texto principal. */
  descripcionLarga?: string
  duracion: string
  precio: number
  capacidad: number
  /** Prácticos, opcionales. La ficha absorbe su ausencia. */
  horarios?: string
  recomendaciones?: string
  /** Vacío = se usa el punto de encuentro por defecto del sitio. */
  puntoEncuentro?: string
  /** Portada. La deriva el backend de `imagenes[0]`; no se edita por separado. */
  imagen: string
  /** Galería completa, en orden. El primer elemento es la portada. */
  imagenes?: string[]
  destacada: boolean
  incluye?: string[]
  queTraer?: string[]
  noIncluye?: string[]
}

export interface Producto {
  id: string
  slug: string
  nombre: string
  /** Meta description de Google (≤160). Vacía = se deriva de la larga. */
  descripcion: string
  /** El relato de la ficha, en párrafos. Es el texto principal. */
  descripcionLarga?: string
  precio: number
  stock: number
  /** Portada. La deriva el backend de `imagenes[0]`; no se edita por separado. */
  imagen: string
  /** Galería completa, en orden. El primer elemento es la portada. */
  imagenes?: string[]
  categoria: string
  badge?: 'Nuevo' | 'Destacado' | null
}

export interface Reserva {
  experienciaId: string
  fecha: string
  cantidadPersonas: number
  nombre: string
  email: string
  telefono: string
  notas?: string
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
}

export interface Pedido {
  items: ItemCarrito[]
  total: number
  nombre: string
  email: string
  direccion: string
}

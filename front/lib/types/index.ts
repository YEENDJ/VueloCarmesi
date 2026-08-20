export interface Experiencia {
  id: string
  slug: string
  nombre: string
  /** Corta: tarjeta del listado y meta description. Máximo 200 caracteres. */
  descripcion: string
  /** Larga: la ficha. Puede venir vacía; el detalle cae a `descripcion`. */
  descripcionLarga?: string
  duracion: string
  precio: number
  capacidad: number
  /** Portada. La deriva el backend de `imagenes[0]`; no se edita por separado. */
  imagen: string
  /** Galería completa, en orden. El primer elemento es la portada. */
  imagenes?: string[]
  destacada: boolean
  incluye?: string[]
  queTraer?: string[]
}

export interface Producto {
  id: string
  slug: string
  nombre: string
  /** Corta: tarjeta de la tienda y meta description. Máximo 200 caracteres. */
  descripcion: string
  /** Larga: la ficha. Puede venir vacía; el detalle cae a `descripcion`. */
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

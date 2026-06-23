export interface Experiencia {
  id: string
  slug: string
  nombre: string
  descripcion: string
  duracion: string
  precio: number
  capacidad: number
  imagen: string
  destacada: boolean
  images?: string[]
  incluye?: string[]
  queTraer?: string[]
}

export interface Producto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: 'cacao' | 'chocolate' | 'otro'
  images?: string[]
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

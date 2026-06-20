export interface Experiencia {
  id: string
  slug: string
  nombre: string
  descripcion: string
  duracion: string       // ej: "4 horas"
  precio: number
  capacidad: number
  imagen: string         // URL relativa o absoluta
  destacada: boolean
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
}

export interface Reserva {
  experienciaId: string
  fecha: string          // ISO date string
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

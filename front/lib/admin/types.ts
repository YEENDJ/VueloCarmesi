export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada'
export type EstadoPedido  = 'pendiente' | 'enviado' | 'entregado' | 'cancelado'

export interface AdminReserva {
  id: string
  experienciaId: string
  fecha: string
  cantidadPersonas: number
  nombre: string
  email: string
  telefono: string
  notas?: string
  estado: EstadoReserva
  createdAt: string
  experiencia?: { id: string; nombre: string }
}

export interface AdminExperiencia {
  id: string
  slug: string
  nombre: string
  descripcion: string
  duracion: string
  precio: number
  capacidad: number
  imagen: string
  destacada: boolean
  archivada: boolean
  createdAt: string
}

export interface AdminProducto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: string
  createdAt: string
}

export interface ItemPedido {
  id: string
  cantidad: number
  precio: number
  producto: { id: string; nombre: string; imagen: string }
}

export interface AdminPedido {
  id: string
  nombre: string
  email: string
  direccion: string
  total: number
  estado: EstadoPedido
  createdAt: string
  items: ItemPedido[]
}

export interface OverviewData {
  reservasMes: number
  pedidosMes: number
  ingresosMes: number
  stockBajo: number
  reservasPorSemana: { semana: string; cantidad: number }[]
  ultimasReservas: AdminReserva[]
  ultimosPedidos: AdminPedido[]
}

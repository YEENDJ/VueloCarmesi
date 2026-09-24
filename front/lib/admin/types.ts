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
  descripcionLarga: string
  duracion: string
  precio: number
  capacidad: number
  imagen: string
  imagenes: string[]
  incluye: string[]
  queTraer: string[]
  noIncluye: string[]
  horarios: string
  recomendaciones: string
  puntoEncuentro: string
  destacada: boolean
  archivada: boolean
  createdAt: string
}

export interface AdminProducto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: number
  stock: number
  imagen: string
  imagenes: string[]
  categoria: string
  badge?: 'Nuevo' | 'Destacado' | null
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
  telefono: string
  direccion: string
  ciudad: string
  codigoPostal: string
  total: number
  estado: EstadoPedido
  createdAt: string
  items: ItemPedido[]
}

/** Mismo recorrido que `ESTADOS_SOLICITUD` en el DTO del backend. */
export const ESTADOS_SOLICITUD = ['nueva', 'contactada', 'cotizada', 'cerrada', 'perdida'] as const
export type EstadoSolicitud = typeof ESTADOS_SOLICITUD[number]

export interface AdminSolicitudGrupo {
  id: string
  tipo: string
  institucion: string
  nit: string | null
  contacto: string
  cargo: string | null
  email: string
  telefono: string
  personas: number
  edades: string | null
  /** Medianoche UTC del día elegido: se formatea con `timeZone: 'UTC'`. */
  fechaTentativa: string | null
  experiencias: string[]
  requiereFactura: boolean
  mensaje: string
  estado: EstadoSolicitud
  createdAt: string
}

/** Mismos valores que `ESTADOS_CONTACTO` en el DTO del backend. */
export const ESTADOS_CONTACTO = ['nuevo', 'respondido'] as const
export type EstadoContacto = typeof ESTADOS_CONTACTO[number]

/** Un mensaje del formulario de /contacto. */
export interface AdminContacto {
  id: string
  nombre: string
  email: string
  telefono: string | null
  mensaje: string
  estado: EstadoContacto
  createdAt: string
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

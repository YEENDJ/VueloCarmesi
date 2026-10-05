/**
 * `pendiente_pago`, `expirada` y `requiere_revision` los pone la pasarela de
 * pagos, no el panel: ver docs/superpowers/specs/2026-09-25-pasarela-pagos-design.md.
 */
export type EstadoReserva =
  | 'pendiente' | 'confirmada' | 'cancelada'
  | 'pendiente_pago' | 'expirada' | 'requiere_revision'
export type EstadoPedido =
  | 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
  | 'pendiente_pago' | 'expirado' | 'requiere_revision'

/** Un intento de cobro en línea. Un pedido o una reserva pueden tener varios. */
export interface AdminPago {
  id: string
  referencia: string
  monto: number
  /** pendiente | aprobado | rechazado | anulado | expirado | error */
  estado: string
  /** tarjeta, pse, nequi… lo que reporte la pasarela. */
  metodo: string | null
  /** Por qué lo rechazó la pasarela, en sus palabras. */
  motivo: string | null
  /** `prueba` = sandbox: no es dinero real y no cuenta en las cifras. */
  modo: 'prueba' | 'produccion' | string
  proveedor: string
  createdAt: string
}

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
  /** Congelados al crearla. Nulos en las reservas de antes de la pasarela. */
  total?: number | null
  porcentajeAbono?: number | null
  montoAbono?: number | null
  venceEn?: string | null
  pagos?: AdminPago[]
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
  /** Slug por idioma. Lo trae la lectura pública; el PATCH de la ficha no. */
  slugs?: Record<string, string>
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
  /** Ver AdminExperiencia.slugs. */
  slugs?: Record<string, string>
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
  /** Nulo en los pedidos nuevos: el checkout ya no lo pide. */
  codigoPostal: string | null
  total: number
  estado: EstadoPedido
  createdAt: string
  items: ItemPedido[]
  venceEn?: string | null
  pagos?: AdminPago[]
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

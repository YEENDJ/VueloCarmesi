import { IsIn } from 'class-validator'

/**
 * El recorrido de una cotización, en el orden en que avanza.
 *
 * `cerrada` es la ganada —el grupo confirmó— y `perdida` la que no se dio. Las
 * dos terminan el recorrido; se separan porque son justo la cuenta que importa:
 * de cada diez cotizaciones, cuántas se convierten en visita.
 */
export const ESTADOS_SOLICITUD = [
  'nueva', 'contactada', 'cotizada', 'cerrada', 'perdida',
] as const

export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number]

export class UpdateEstadoSolicitudDto {
  @IsIn(ESTADOS_SOLICITUD)
  estado: EstadoSolicitud
}

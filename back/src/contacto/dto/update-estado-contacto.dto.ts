import { IsIn } from 'class-validator'

/**
 * Un mensaje de contacto solo pide una cosa: que alguien lo conteste. No hay
 * embudo que medir como en las cotizaciones de grupo, así que dos estados.
 */
export const ESTADOS_CONTACTO = ['nuevo', 'respondido'] as const

export type EstadoContacto = (typeof ESTADOS_CONTACTO)[number]

export class UpdateEstadoContactoDto {
  @IsIn(ESTADOS_CONTACTO)
  estado: EstadoContacto
}

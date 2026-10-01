import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * Sobre qué se cobra. Solo el id: el monto lo calcula siempre el backend desde
 * el pedido o la reserva, nunca lo manda el cliente.
 */
export class CrearPagoDto {
  @IsOptional() @IsString() @MaxLength(40)
  pedidoId?: string

  @IsOptional() @IsString() @MaxLength(40)
  reservaId?: string

  /** Idioma de la página a la que vuelve el cliente desde la pasarela. */
  @IsOptional() @IsIn(['es', 'en'])
  idioma?: 'es' | 'en'
}

export class ReintentarPagoDto {
  @IsOptional() @IsIn(['es', 'en'])
  idioma?: 'es' | 'en'
}

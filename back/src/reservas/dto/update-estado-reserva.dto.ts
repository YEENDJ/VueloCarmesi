import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateEstadoReservaDto {
  @IsIn(['pendiente', 'confirmada', 'cancelada'])
  estado: 'pendiente' | 'confirmada' | 'cancelada'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string
}

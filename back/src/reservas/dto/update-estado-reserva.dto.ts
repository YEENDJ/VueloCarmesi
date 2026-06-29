import { IsIn, IsOptional, IsString } from 'class-validator'

export class UpdateEstadoReservaDto {
  @IsIn(['pendiente', 'confirmada', 'cancelada'])
  estado: 'pendiente' | 'confirmada' | 'cancelada'

  @IsOptional()
  @IsString()
  motivo?: string
}

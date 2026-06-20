import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator'

export class CreateReservaDto {
  @IsString() experienciaId: string
  @IsDateString() fecha: string
  @IsNumber() @Min(1) cantidadPersonas: number
  @IsString() nombre: string
  @IsString() email: string
  @IsString() telefono: string
  @IsOptional() @IsString() notas?: string
}

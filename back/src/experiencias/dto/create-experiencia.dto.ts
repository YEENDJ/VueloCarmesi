import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator'

export class CreateExperienciaDto {
  @IsString() nombre: string
  @IsString() slug: string
  @IsString() descripcion: string
  @IsString() duracion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(1) capacidad: number
  @IsOptional() @IsString() imagen?: string
  @IsOptional() @IsBoolean() destacada?: boolean
}

import { IsString, IsNumber, IsOptional, Min } from 'class-validator'

export class CreateProductoDto {
  @IsString() nombre: string
  @IsString() slug: string
  @IsString() descripcion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(0) stock: number
  @IsString() categoria: string
  @IsOptional() @IsString() imagen?: string
}

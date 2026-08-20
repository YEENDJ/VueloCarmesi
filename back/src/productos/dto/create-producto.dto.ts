import {
  IsString, IsNumber, IsOptional, IsIn, IsArray, Min, MaxLength, ArrayMaxSize,
} from 'class-validator'

/** Mismo tope que en experiencias, por la misma razón: peso de la ficha. */
export const MAX_IMAGENES = 8

export class CreateProductoDto {
  @IsString() nombre: string

  // Corta: tarjeta de la tienda y meta description.
  @IsString() @MaxLength(200) descripcion: string

  @IsOptional() @IsString() descripcionLarga?: string

  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(0) stock: number
  @IsString() categoria: string

  // El primer elemento es la portada; `imagen` la deriva el service.
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(MAX_IMAGENES)
  imagenes?: string[]

  @IsOptional() @IsIn(['Nuevo', 'Destacado']) badge?: string
}

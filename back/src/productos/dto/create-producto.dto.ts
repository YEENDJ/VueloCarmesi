import {
  IsString, IsNumber, IsOptional, IsIn, IsArray, Min, MaxLength, ArrayMaxSize,
} from 'class-validator'

/** Mismo tope que en experiencias, por la misma razón: peso de la ficha. */
export const MAX_IMAGENES = 8

/** Donde Google recorta la meta description. */
export const MAX_META = 160

export class CreateProductoDto {
  @IsString() nombre: string

  // Ya no va en la tarjeta: su unico trabajo es la meta description, donde
  // Google recorta en ~160. Opcional: si se deja vacia, el front la deriva
  // de descripcionLarga.
  @IsOptional() @IsString() @MaxLength(MAX_META) descripcion?: string

  @IsOptional() @IsString() descripcionLarga?: string

  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(0) stock: number
  @IsString() categoria: string

  // El primer elemento es la portada; `imagen` la deriva el service.
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(MAX_IMAGENES)
  imagenes?: string[]

  @IsOptional() @IsIn(['Nuevo', 'Destacado']) badge?: string
}

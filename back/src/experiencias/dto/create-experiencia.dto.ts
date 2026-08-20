import {
  IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, MaxLength, ArrayMaxSize,
} from 'class-validator'

/** Tope de fotos por ficha. Más que esto vuelve el detalle un ladrillo de descargar. */
export const MAX_IMAGENES = 8

export class CreateExperienciaDto {
  @IsString() nombre: string

  // La corta va en la tarjeta y en la meta description; por encima de ~200
  // caracteres Google la recorta y la tarjeta se desmaqueta.
  @IsString() @MaxLength(200) descripcion: string

  @IsOptional() @IsString() descripcionLarga?: string

  @IsString() duracion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(1) capacidad: number

  // El primer elemento es la portada. `imagen` no se acepta desde fuera: la
  // calcula el service a partir de esta lista para que no puedan separarse.
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(MAX_IMAGENES)
  imagenes?: string[]

  @IsOptional() @IsArray() @IsString({ each: true }) incluye?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) queTraer?: string[]

  @IsOptional() @IsBoolean() destacada?: boolean
  @IsOptional() @IsBoolean() archivada?: boolean
}

import {
  IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsNotEmpty,
  Min, MaxLength, ArrayMaxSize, ArrayMinSize,
} from 'class-validator'

/** Tope de fotos por ficha. Más que esto vuelve el detalle un ladrillo de descargar. */
export const MAX_IMAGENES = 8

/** Donde Google recorta la meta description. */
export const MAX_META = 160

/**
 * Crear exige la ficha completa: los siete campos que definen la anatomía de la
 * página. Editar no —ver UpdateExperienciaDto—, porque si el backend los
 * exigiera siempre, una ficha vieja incompleta no se podría ni corregir de
 * precio sin antes rellenarla entera.
 */
export class CreateExperienciaDto {
  @IsString() @IsNotEmpty() nombre: string

  // Opcional: ya no va en la tarjeta. Solo alimenta la meta description, y si
  // se deja vacía el front la deriva de descripcionLarga.
  @IsOptional() @IsString() @MaxLength(MAX_META) descripcion?: string

  @IsString() @IsNotEmpty() descripcionLarga: string

  @IsString() @IsNotEmpty() duracion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(1) capacidad: number

  // El primer elemento es la portada. `imagen` no se acepta desde fuera: la
  // calcula el service a partir de esta lista para que no puedan separarse.
  @IsArray() @IsString({ each: true }) @ArrayMinSize(1) @ArrayMaxSize(MAX_IMAGENES)
  imagenes: string[]

  @IsArray() @IsString({ each: true }) @ArrayMinSize(1) incluye: string[]

  // Opcionales: la ficha absorbe su ausencia sin verse a medio hacer.
  @IsOptional() @IsArray() @IsString({ each: true }) queTraer?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) noIncluye?: string[]
  @IsOptional() @IsString() horarios?: string
  @IsOptional() @IsString() recomendaciones?: string
  // Vacío = se usa el punto de encuentro por defecto de SiteConfig.
  @IsOptional() @IsString() puntoEncuentro?: string

  @IsOptional() @IsBoolean() destacada?: boolean
  @IsOptional() @IsBoolean() archivada?: boolean
}

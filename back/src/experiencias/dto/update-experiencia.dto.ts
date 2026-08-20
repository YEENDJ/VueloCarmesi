import {
  IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, MaxLength, ArrayMaxSize,
} from 'class-validator'
import { MAX_IMAGENES, MAX_META } from './create-experiencia.dto'

/**
 * Existe como clase, y no como `Partial<CreateExperienciaDto>`, porque el
 * ValidationPipe de Nest necesita una clase real para correr: con un tipo
 * `Partial<...>` el metatype es Object y la validación se salta entera.
 *
 * Aquí NADA es obligatorio, a propósito. Es un PATCH, y además las fichas
 * anteriores a este modelo están incompletas: exigirles el relato o una foto
 * para aceptar un cambio de precio las dejaría congeladas. La exigencia de
 * ficha completa vive en el formulario del panel, que avisa qué falta.
 */
export class UpdateExperienciaDto {
  @IsOptional() @IsString() nombre?: string
  @IsOptional() @IsString() @MaxLength(MAX_META) descripcion?: string
  @IsOptional() @IsString() descripcionLarga?: string
  @IsOptional() @IsString() duracion?: string
  @IsOptional() @IsNumber() @Min(0) precio?: number
  @IsOptional() @IsNumber() @Min(1) capacidad?: number

  // `imagen` no se acepta: la deriva el service de imagenes[0].
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(MAX_IMAGENES)
  imagenes?: string[]

  @IsOptional() @IsArray() @IsString({ each: true }) incluye?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) queTraer?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) noIncluye?: string[]
  @IsOptional() @IsString() horarios?: string
  @IsOptional() @IsString() recomendaciones?: string
  @IsOptional() @IsString() puntoEncuentro?: string

  @IsOptional() @IsBoolean() destacada?: boolean
  @IsOptional() @IsBoolean() archivada?: boolean
}

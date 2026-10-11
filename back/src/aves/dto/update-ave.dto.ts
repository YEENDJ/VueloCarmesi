import { IsString, IsIn, IsOptional, IsNotEmpty, Matches, MaxLength, IsArray, ArrayNotEmpty } from 'class-validator'
import { TIPOS_AVE, PATRON_FOCO, MAX_ALT } from './create-ave.dto'

export class UpdateAveDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) cientifico?: string
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) ingles?: string
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) local?: string
  @IsOptional() @IsIn(TIPOS_AVE) tipo?: (typeof TIPOS_AVE)[number]
  @IsOptional() @IsString() imagen?: string
  @IsOptional() @Matches(PATRON_FOCO, { message: 'El encuadre va como «50% 50%»' }) foco?: string
  @IsOptional() @IsString() @MaxLength(MAX_ALT) alt?: string
  @IsOptional() @IsString() @MaxLength(MAX_ALT) altEn?: string
}

/** El orden completo de un tipo, de arriba abajo, tal como queda en el panel. */
export class OrdenAvesDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) ids: string[]
}

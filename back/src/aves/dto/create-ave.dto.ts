import { IsString, IsIn, IsOptional, IsNotEmpty, Matches, MaxLength } from 'class-validator'

export const TIPOS_AVE = ['residente', 'migratoria'] as const

/** object-position en porcentajes, «X% Y%». Es lo único que escribe el selector del panel. */
export const PATRON_FOCO = /^(100|\d{1,2})% (100|\d{1,2})%$/

/** Lo que un lector de pantalla aguanta antes de que el alt deje de ser útil. */
export const MAX_ALT = 200

export class CreateAveDto {
  @IsString() @IsNotEmpty() @MaxLength(120) cientifico: string
  @IsString() @IsNotEmpty() @MaxLength(120) ingles: string
  @IsString() @IsNotEmpty() @MaxLength(120) local: string
  @IsIn(TIPOS_AVE) tipo: (typeof TIPOS_AVE)[number]

  @IsOptional() @IsString() imagen?: string
  @IsOptional() @Matches(PATRON_FOCO, { message: 'El encuadre va como «50% 50%»' }) foco?: string
  @IsOptional() @IsString() @MaxLength(MAX_ALT) alt?: string
  // Opcional: si llega vacío, el service lo pide a DeepL.
  @IsOptional() @IsString() @MaxLength(MAX_ALT) altEn?: string
}

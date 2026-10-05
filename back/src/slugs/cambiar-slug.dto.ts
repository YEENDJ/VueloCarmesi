import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { IDIOMAS_PUBLICOS } from '../traduccion/campos'

/**
 * El cambio de URL de una ficha. Va por su propia ruta y no dentro del PATCH
 * de la ficha a propósito: cambiar la dirección pública tiene consecuencias
 * —Google, enlaces compartidos— que un «Guardar» del formulario no debería
 * poder tener de rebote.
 */
export class CambiarSlugDto {
  // Tope holgado: es una URL, no un texto. toSlug la normaliza después.
  @IsString() @IsNotEmpty() @MaxLength(120) slug: string

  // Ausente = español, el slug de la ficha original.
  @IsOptional() @IsIn(IDIOMAS_PUBLICOS) idioma?: string
}

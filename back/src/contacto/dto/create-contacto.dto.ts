import { Transform } from 'class-transformer'
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'
import { TELEFONO_REGEX } from '../../reservas/dto/create-reserva.dto'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

/** Tope del mensaje. Un formulario público sin él acepta un megabyte de texto. */
export const MAX_MENSAJE_CONTACTO = 2000

export class CreateContactoDto {
  // Con trim antes de validar: sin él, «   » pasaba el antiguo @IsNotEmpty().
  @Transform(trim)
  @IsString()
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  nombre: string

  @Transform(trim)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(255, { message: 'El email no puede superar 255 caracteres' })
  email: string

  // Opcional: es el que permite contestar por WhatsApp, que es como prefiere
  // hablar la mayoría, pero no se exige para escribir.
  @IsOptional()
  @Transform(trim)
  @Matches(TELEFONO_REGEX, { message: 'El teléfono debe tener entre 7 y 15 dígitos' })
  telefono?: string

  @Transform(trim)
  @IsString()
  @Length(1, MAX_MENSAJE_CONTACTO, {
    message: `El mensaje debe tener entre 1 y ${MAX_MENSAJE_CONTACTO} caracteres`,
  })
  mensaje: string

  // Honeypot anti-bots: los humanos nunca llenan este campo. Mismo patrón que
  // `create-reserva.dto.ts`.
  @IsOptional() @IsString()
  website?: string
}

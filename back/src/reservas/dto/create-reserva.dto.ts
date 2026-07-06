import { Transform } from 'class-transformer'
import {
  IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional,
  IsString, Length, Matches, MaxLength, Min,
} from 'class-validator'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

export const TELEFONO_REGEX = /^\+?(?:[\s-]*\d){7,15}[\s-]*$/

export class CreateReservaDto {
  @IsString() @IsNotEmpty()
  experienciaId: string

  @IsDateString({}, { message: 'La fecha no es válida' })
  fecha: string

  @IsInt({ message: 'La cantidad de personas debe ser un número entero' })
  @Min(1, { message: 'Debe reservar para al menos 1 persona' })
  cantidadPersonas: number

  @Transform(trim)
  @IsString()
  @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
  nombre: string

  @Transform(trim)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(255, { message: 'El email no puede superar 255 caracteres' })
  email: string

  @Transform(trim)
  @Matches(TELEFONO_REGEX, { message: 'El teléfono debe tener entre 7 y 15 dígitos' })
  telefono: string

  @IsOptional() @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notas?: string

  // Honeypot anti-bots: los humanos nunca llenan este campo
  @IsOptional() @IsString()
  website?: string
}

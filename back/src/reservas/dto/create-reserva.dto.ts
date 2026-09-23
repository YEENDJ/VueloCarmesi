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

  // Solo el día, `YYYY-MM-DD`: el rango (de mañana a seis meses) lo revisa el
  // service con `fechaReservaValida`, que calcula «hoy» en hora de Bogotá.
  @IsDateString({ strict: true }, { message: 'La fecha no es válida' })
  fecha: string

  // El tope real es la capacidad de la experiencia, y ese lo revisa el
  // service contra la base: el DTO no la conoce.
  @IsInt({ message: 'La cantidad de personas debe ser un número entero' })
  @Min(1, { message: 'Debe reservar para al menos 1 persona' })
  cantidadPersonas: number

  // Mínimo 2 y no 3: «Li», «Bo» o «Ed» son nombres reales.
  @Transform(trim)
  @IsString()
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  nombre: string

  @Transform(trim)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(255, { message: 'El email no puede superar 255 caracteres' })
  email: string

  @Transform(trim)
  @Matches(TELEFONO_REGEX, { message: 'El teléfono debe tener entre 7 y 15 dígitos' })
  telefono: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notas?: string

  // Honeypot anti-bots: los humanos nunca llenan este campo
  @IsOptional() @IsString()
  website?: string
}

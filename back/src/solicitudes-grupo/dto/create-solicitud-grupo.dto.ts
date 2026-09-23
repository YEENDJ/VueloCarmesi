import { Transform } from 'class-transformer'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEmail, IsIn, IsInt,
  IsOptional, IsString, Length, Matches, Max, MaxLength, Min,
} from 'class-validator'
import { TELEFONO_REGEX } from '../../reservas/dto/create-reserva.dto'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

/**
 * Los cinco tipos de solicitante.
 *
 * Es una lista cerrada y no texto libre porque es la columna por la que se va a
 * contar: «cuántas solicitudes escolares entraron este semestre» no se responde
 * sobre un campo donde cada quien escribe lo que quiere.
 */
export const TIPOS_SOLICITANTE = [
  'colegio', 'universidad', 'empresa', 'agencia', 'otro',
] as const

/**
 * Tope de personas por solicitud.
 *
 * No es una capacidad operativa —la finca no la tiene publicada todavía— sino
 * un freno a lo absurdo: un formulario público sin tope acepta 999.999.999 y
 * eso es un bot o un dedo pegado, no un colegio. La capacidad real se contesta
 * en la cotización.
 */
export const MAX_PERSONAS = 500

/**
 * Los slugs que se pueden marcar, mismo listado que
 * `front/lib/schemas/solicitud-grupo.ts`. Lista cerrada por el mismo motivo que
 * `tipo`: es por lo que se va a contar qué piden los grupos.
 */
export const EXPERIENCIAS_COTIZABLES = [
  'experiencia-cacaotera',
  'avistamiento-de-aves',
  'experiencia-aves-cacao',
  'chocoterapia',
  'a-medida',
] as const

export class CreateSolicitudGrupoDto {
  @IsIn(TIPOS_SOLICITANTE, { message: 'El tipo de solicitante no es válido' })
  tipo: (typeof TIPOS_SOLICITANTE)[number]

  @Transform(trim)
  @IsString()
  @Length(3, 140, { message: 'El nombre de la institución debe tener entre 3 y 140 caracteres' })
  institucion: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40, { message: 'El NIT no puede superar 40 caracteres' })
  nit?: string

  @Transform(trim)
  @IsString()
  // Mínimo 2: «Li» o «Bo» son nombres reales. Mismo tope que la reserva.
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  contacto: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100, { message: 'El cargo no puede superar 100 caracteres' })
  cargo?: string

  @Transform(trim)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(255, { message: 'El email no puede superar 255 caracteres' })
  email: string

  @Transform(trim)
  @Matches(TELEFONO_REGEX, { message: 'El teléfono debe tener entre 7 y 15 dígitos' })
  telefono: string

  // Sin tope por capacidad de experiencia, que es justamente el motivo de que
  // esta tabla exista: el formulario de reserva corta en 12 y este comprador
  // llega con 40.
  @IsInt({ message: 'La cantidad de personas debe ser un número entero' })
  @Min(1, { message: 'Indica para cuántas personas es la cotización' })
  @Max(MAX_PERSONAS, { message: `Para más de ${MAX_PERSONAS} personas, escríbenos directamente` })
  personas: number

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60, { message: 'Las edades no pueden superar 60 caracteres' })
  edades?: string

  // Opcional a propósito: un coordinador pide la cotización para poder proponer
  // la salida, y la fecha depende de una aprobación que todavía no tiene.
  // Exigírsela lo obliga a inventarla o a abandonar el formulario.
  // Que sea posterior a hoy lo revisa el service, que calcula «hoy» en Bogotá.
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'La fecha no es válida' })
  fechaTentativa?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(EXPERIENCIAS_COTIZABLES, { each: true, message: 'Hay una experiencia que no existe' })
  experiencias?: string[]

  @IsOptional()
  @IsBoolean()
  requiereTransporte?: boolean

  @IsOptional()
  @IsBoolean()
  requiereFactura?: boolean

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000, { message: 'El mensaje no puede superar 1000 caracteres' })
  mensaje?: string

  // Honeypot anti-bots: los humanos nunca llenan este campo. Mismo patrón que
  // `create-reserva.dto.ts`.
  @IsOptional() @IsString()
  website?: string
}

import { Transform } from 'class-transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

/** «Consultar mi reserva»: el código que trae el correo y el correo de la reserva. */
export class ConsultarReservaDto {
  // El formato lo revisa normalizarCodigo (pedidos/consulta.util), igual que en pedidos.
  @Transform(trim) @IsString() @MaxLength(40)
  codigo: string

  @Transform(trim) @IsEmail() @MaxLength(255)
  email: string
}

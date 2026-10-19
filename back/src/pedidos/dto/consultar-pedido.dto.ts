import { Transform } from 'class-transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

/** «Consultar mi pedido»: el código que trae el correo y el correo de la compra. */
export class ConsultarPedidoDto {
  // El formato lo revisa normalizarCodigo, que acepta el código corto y el id
  // completo; aquí solo se pone un tope.
  @Transform(trim) @IsString() @MaxLength(40)
  codigo: string

  @Transform(trim) @IsEmail() @MaxLength(255)
  email: string
}

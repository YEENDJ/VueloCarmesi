import { IsString, IsNotEmpty, IsEmail } from 'class-validator'

export class CreateContactoDto {
  @IsString() @IsNotEmpty() nombre: string
  @IsEmail() email: string
  @IsString() @IsNotEmpty() mensaje: string
}

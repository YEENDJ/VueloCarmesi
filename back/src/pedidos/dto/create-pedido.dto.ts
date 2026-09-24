import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsInt, IsNotEmpty, IsOptional,
  IsString, Length, Matches, Max, MaxLength, Min, ValidateNested,
} from 'class-validator'
import { TELEFONO_REGEX } from '../../reservas/dto/create-reserva.dto'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

/** Tope por línea. Un pedido más grande es venta al por mayor y va por WhatsApp. */
export const MAX_CANTIDAD_POR_PRODUCTO = 99

/** Tope de líneas. El catálogo entero cabe de sobra. */
export const MAX_ITEMS_PEDIDO = 50

export class ItemPedidoDto {
  @IsString() @IsNotEmpty()
  productoId: string

  // Entero y al menos 1. Con el antiguo @IsNumber() pasaban -100 y 0.5: una
  // cantidad negativa esquivaba el control de stock, dejaba el total negativo
  // y al «descontar» le SUMABA unidades al inventario.
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @Max(MAX_CANTIDAD_POR_PRODUCTO, {
    message: `La cantidad máxima por producto es ${MAX_CANTIDAD_POR_PRODUCTO}`,
  })
  cantidad: number
}

export class CreatePedidoDto {
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

  @Transform(trim)
  @IsString()
  @Length(5, 200, { message: 'La dirección debe tener entre 5 y 200 caracteres' })
  direccion: string

  @Transform(trim)
  @IsString()
  @Length(2, 100, { message: 'La ciudad debe tener entre 2 y 100 caracteres' })
  ciudad: string

  @Transform(trim)
  @IsString()
  @Length(3, 20, { message: 'El código postal debe tener entre 3 y 20 caracteres' })
  codigoPostal: string

  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido no tiene productos' })
  @ArrayMaxSize(MAX_ITEMS_PEDIDO, { message: `El pedido no puede tener más de ${MAX_ITEMS_PEDIDO} productos` })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[]

  // Honeypot anti-bots: los humanos nunca llenan este campo. Mismo patrón que
  // `create-reserva.dto.ts`.
  @IsOptional() @IsString()
  website?: string
}

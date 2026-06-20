import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

class ItemPedidoDto {
  @IsString() productoId: string
  @IsNumber() cantidad: number
}

export class CreatePedidoDto {
  @IsString() nombre: string
  @IsString() email: string
  @IsString() direccion: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemPedidoDto) items: ItemPedidoDto[]
}

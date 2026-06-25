import { IsIn } from 'class-validator'

export class UpdatePedidoDto {
  @IsIn(['pendiente', 'enviado', 'entregado', 'cancelado']) estado: string
}

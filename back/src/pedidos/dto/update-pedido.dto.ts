import { IsIn } from 'class-validator'

export class UpdatePedidoDto {
  // `pagado` para marcar a mano un pago que llegó por fuera (transferencia).
  // Los estados que pone la pasarela —pendiente_pago, expirado,
  // requiere_revision— no se eligen desde el panel.
  @IsIn(['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']) estado: string
}

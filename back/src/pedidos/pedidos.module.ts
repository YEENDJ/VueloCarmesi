import { Module } from '@nestjs/common'
import { PedidosController } from './pedidos.controller'
import { PedidosService } from './pedidos.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'
import { PagosModule } from '../pagos/pagos.module'

@Module({
  imports: [NotificacionesModule, PagosModule],
  controllers: [PedidosController],
  providers: [PedidosService, PrismaService],
})
export class PedidosModule {}

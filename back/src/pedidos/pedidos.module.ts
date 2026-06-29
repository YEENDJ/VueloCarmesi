import { Module } from '@nestjs/common'
import { PedidosController } from './pedidos.controller'
import { PedidosService } from './pedidos.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [NotificacionesModule],
  controllers: [PedidosController],
  providers: [PedidosService, PrismaService],
})
export class PedidosModule {}

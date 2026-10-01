import { Module } from '@nestjs/common'
import { ReservasController } from './reservas.controller'
import { ReservasService } from './reservas.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'
import { PagosModule } from '../pagos/pagos.module'

@Module({
  imports: [NotificacionesModule, PagosModule],
  controllers: [ReservasController],
  providers: [ReservasService, PrismaService],
})
export class ReservasModule {}

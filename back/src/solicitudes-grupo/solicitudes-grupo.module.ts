import { Module } from '@nestjs/common'
import { SolicitudesGrupoController } from './solicitudes-grupo.controller'
import { SolicitudesGrupoService } from './solicitudes-grupo.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [NotificacionesModule],
  controllers: [SolicitudesGrupoController],
  providers: [SolicitudesGrupoService, PrismaService],
})
export class SolicitudesGrupoModule {}

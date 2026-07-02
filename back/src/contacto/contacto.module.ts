import { Module } from '@nestjs/common'
import { ContactoController } from './contacto.controller'
import { ContactoService } from './contacto.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [NotificacionesModule],
  controllers: [ContactoController],
  providers: [ContactoService, PrismaService],
})
export class ContactoModule {}

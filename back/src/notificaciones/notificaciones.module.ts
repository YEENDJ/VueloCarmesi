import { Module } from '@nestjs/common'
import { NotificacionesService } from './notificaciones.service'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'
import { PrismaService } from '../prisma.service'

@Module({
  providers: [NotificacionesService, EmailService, TelegramService, PrismaService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}

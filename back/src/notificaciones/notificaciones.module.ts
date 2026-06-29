import { Module } from '@nestjs/common'
import { NotificacionesService } from './notificaciones.service'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'

@Module({
  providers: [NotificacionesService, EmailService, TelegramService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}

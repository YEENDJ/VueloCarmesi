import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateContactoDto } from './dto/create-contacto.dto'

@Injectable()
export class ContactoService {
  private readonly logger = new Logger(ContactoService.name)

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  async create(dto: CreateContactoDto) {
    const contacto = await this.prisma.contacto.create({ data: dto })

    this.notificaciones
      .enviarNuevoContacto(contacto)
      .catch(err => this.logger.error('Notificación de contacto fallida', err))

    return { id: contacto.id, createdAt: contacto.createdAt }
  }
}

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
    // `website` es el honeypot: no es columna, así que no puede llegar a Prisma.
    const { website, ...data } = dto

    // Bot: se responde como si hubiera salido bien, igual que en grupos y
    // reservas. Decirle que se detectó solo le enseña cuál campo no llenar.
    if (website) {
      this.logger.warn(`Contacto descartado por honeypot: ${dto.email}`)
      return { id: 'descartado', createdAt: new Date() }
    }

    const contacto = await this.prisma.contacto.create({ data })

    this.notificaciones
      .enviarNuevoContacto(contacto)
      .catch(err => this.logger.error('Notificación de contacto fallida', err))

    return { id: contacto.id, createdAt: contacto.createdAt }
  }
}

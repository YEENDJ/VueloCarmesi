import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateSolicitudGrupoDto } from './dto/create-solicitud-grupo.dto'

@Injectable()
export class SolicitudesGrupoService {
  private readonly logger = new Logger(SolicitudesGrupoService.name)

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  async create(dto: CreateSolicitudGrupoDto) {
    // `website` es el honeypot y `fechaTentativa` llega como texto: los dos hay
    // que sacarlos del objeto antes de que llegue a Prisma. El honeypot además
    // no es una columna, así que pasarlo entero reventaría el `create`.
    const { website, fechaTentativa, ...rest } = dto

    // Bot: se responde como si hubiera salido bien. Decirle que se detectó solo
    // le enseña a la siguiente pasada cuál campo no debe llenar.
    if (website) {
      this.logger.warn(`Solicitud de grupo descartada por honeypot: ${dto.email}`)
      return { id: 'descartada', createdAt: new Date() }
    }

    const solicitud = await this.prisma.solicitudGrupo.create({
      data: {
        ...rest,
        ...(fechaTentativa ? { fechaTentativa: new Date(fechaTentativa) } : {}),
      },
    })

    this.notificaciones
      .enviarNuevaSolicitudGrupo(solicitud)
      .catch(err => this.logger.error('Notificación de solicitud de grupo fallida', err))

    // Solo el acuse. Devolver la fila entera reflejaría de vuelta los datos de
    // contacto sin que nadie los necesite.
    return { id: solicitud.id, createdAt: solicitud.createdAt }
  }
}

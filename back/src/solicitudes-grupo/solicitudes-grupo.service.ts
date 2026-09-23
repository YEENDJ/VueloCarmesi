import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateSolicitudGrupoDto } from './dto/create-solicitud-grupo.dto'
import { fechaMinimaReserva } from '../reservas/fecha-reserva.util'
import type { EstadoSolicitud } from './dto/update-estado-solicitud.dto'

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

    // Sin tope por arriba, a diferencia de la reserva: un colegio planea con
    // un año de anticipación. Por abajo sí: una fecha pasada es un error.
    if (fechaTentativa && fechaTentativa.slice(0, 10) < fechaMinimaReserva()) {
      throw new BadRequestException('La fecha tentativa debe ser posterior a hoy')
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

  /** Las más recientes primero; el índice (estado, createdAt) ya existe. */
  findAll() {
    return this.prisma.solicitudGrupo.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async updateEstado(id: string, estado: EstadoSolicitud) {
    await this.existeOFalla(id)
    return this.prisma.solicitudGrupo.update({ where: { id }, data: { estado } })
  }

  /**
   * Para el spam que se cuele y las pruebas. Una cotización real que no se dio
   * no se borra: se marca `perdida`, que es lo que alimenta la cuenta.
   */
  async remove(id: string) {
    await this.existeOFalla(id)
    await this.prisma.solicitudGrupo.delete({ where: { id } })
    return { id }
  }

  private async existeOFalla(id: string) {
    const existe = await this.prisma.solicitudGrupo.findUnique({ where: { id }, select: { id: true } })
    if (!existe) throw new NotFoundException('La solicitud ya no existe')
  }
}

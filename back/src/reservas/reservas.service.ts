import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'
import { fechaReservaValida, MESES_HORIZONTE_MAXIMO } from './fecha-reserva.util'

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name)

  private static readonly TRANSICIONES_INVALIDAS: Partial<Record<string, string[]>> = {
    cancelada: ['confirmada', 'pendiente'],
  }

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  findAll() {
    return this.prisma.reserva.findMany({
      include: { experiencia: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } })
    if (!reserva) throw new NotFoundException()
    return reserva
  }

  async create(dto: CreateReservaDto) {
    // `website` es el honeypot: no es columna, así que no puede llegar a Prisma.
    const { fecha, website, ...rest } = dto

    // Bot: se responde como si hubiera salido bien, igual que en grupos.
    // Decirle que se detectó solo le enseña cuál campo no debe llenar.
    if (website) {
      this.logger.warn(`Reserva descartada por honeypot: ${dto.email}`)
      return { id: 'descartada', createdAt: new Date() }
    }

    // El formulario ya pone el mínimo y el máximo en el calendario, pero eso
    // es una ayuda, no una regla: la regla vive acá. Sin ella entraban
    // reservas para ayer, que el equipo tenía que rechazar a mano.
    if (!fechaReservaValida(fecha)) {
      throw new BadRequestException(
        `La fecha debe estar entre mañana y los próximos ${MESES_HORIZONTE_MAXIMO} meses`,
      )
    }

    const experiencia = await this.prisma.experiencia.findUnique({
      where: { id: rest.experienciaId },
      select: { capacidad: true, archivada: true },
    })
    // Una archivada ya no se ofrece: aceptarle una reserva es venderle a
    // alguien una salida que la finca dejó de hacer.
    if (!experiencia || experiencia.archivada) {
      throw new NotFoundException('La experiencia no existe o ya no está disponible')
    }
    // El desplegable corta en la capacidad; esto es para quien llama a la API
    // sin pasar por él. Los grupos más grandes van por /grupos.
    if (rest.cantidadPersonas > experiencia.capacidad) {
      throw new BadRequestException(
        `Esta experiencia admite hasta ${experiencia.capacidad} personas por reserva`,
      )
    }

    const reserva = await this.prisma.reserva.create({
      data: { ...rest, fecha: new Date(fecha) },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })

    this.notificaciones
      .enviarConfirmacionReserva(reserva)
      .catch(err => this.logger.error('Notificación de reserva fallida', err))

    return reserva
  }

  async update(id: string, dto: Partial<CreateReservaDto>) {
    await this.findById(id)
    // `website` es el honeypot del DTO de creación, que este hereda: no es columna.
    const { fecha, website: _website, ...rest } = dto
    return this.prisma.reserva.update({
      where: { id },
      data: { ...rest, ...(fecha ? { fecha: new Date(fecha) } : {}) },
    })
  }

  async cambiarEstado(id: string, dto: UpdateEstadoReservaDto) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })
    if (!reserva) throw new NotFoundException()

    const invalidos = ReservasService.TRANSICIONES_INVALIDAS[reserva.estado] ?? []
    if (invalidos.includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de "${reserva.estado}" a "${dto.estado}"`
      )
    }

    const updated = await this.prisma.reserva.update({
      where: { id },
      data: { estado: dto.estado },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })

    if (dto.estado === 'confirmada') {
      this.notificaciones
        .enviarReservaConfirmadaCliente(updated)
        .catch(err => this.logger.error('Notificación confirmación fallida', err))
    } else if (dto.estado === 'cancelada') {
      this.notificaciones
        .enviarReservaCanceladaCliente(updated, dto.motivo)
        .catch(err => this.logger.error('Notificación cancelación fallida', err))
    }

    return updated
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.reserva.delete({ where: { id } })
  }
}

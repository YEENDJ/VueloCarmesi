import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateReservaDto } from './dto/create-reserva.dto'

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name)

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
    const { fecha, ...rest } = dto
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
    const { fecha, ...rest } = dto
    return this.prisma.reserva.update({
      where: { id },
      data: { ...rest, ...(fecha ? { fecha: new Date(fecha) } : {}) },
    })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.reserva.delete({ where: { id } })
  }
}

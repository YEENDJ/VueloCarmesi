import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'
import { fechaReservaValida, MESES_HORIZONTE_MAXIMO } from './fecha-reserva.util'
import { PagosService } from '../pagos/pagos.service'
import { PAGOS_PANEL } from '../pagos/panel'
import { venceEnDesde } from '../pagos/config'
import { calcularAbono, CLAVE_ABONO, leerPorcentajeAbono } from '../pagos/abono'

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name)

  private static readonly TRANSICIONES_INVALIDAS: Partial<Record<string, string[]>> = {
    cancelada: ['confirmada', 'pendiente'],
    // Venció sin pago. Solo vuelve sola, si ese pago llega (PagosService).
    expirada: ['confirmada', 'pendiente', 'cancelada'],
  }

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
    private pagos: PagosService,
  ) {}

  findAll() {
    return this.prisma.reserva.findMany({
      include: { experiencia: { select: { id: true, nombre: true } }, pagos: PAGOS_PANEL },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id }, include: { pagos: PAGOS_PANEL } })
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
      select: { capacidad: true, archivada: true, precio: true },
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

    // Lo que se le ofrece queda congelado en la reserva: si mañana cambia el
    // precio o el porcentaje de abono, esta conserva sus cifras.
    const total = experiencia.precio * rest.cantidadPersonas
    const cobro = this.pagos.activo && total > 0 ? await this.abono(total) : null

    const reserva = await this.prisma.reserva.create({
      data: {
        ...rest,
        fecha: new Date(fecha),
        total,
        ...(cobro
          ? { ...cobro, estado: 'pendiente_pago', venceEn: venceEnDesde(new Date()) }
          : {}),
      },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })

    // Con cobro en línea, el aviso de «nueva reserva» sale al aprobarse el
    // abono (PagosService), no al llenar el formulario.
    if (reserva.estado !== 'pendiente_pago') {
      this.notificaciones
        .enviarConfirmacionReserva(reserva)
        .catch(err => this.logger.error('Notificación de reserva fallida', err))
    }

    return reserva
  }

  /**
   * Cuánto se cobra hoy, con el porcentaje de `reservas_abono_porcentaje`. Si
   * el abono redondea a cero no hay qué cobrar y la reserva sigue el flujo
   * manual.
   */
  private async abono(total: number): Promise<{ porcentajeAbono: number; montoAbono: number } | null> {
    const fila = await this.prisma.siteConfig.findUnique({ where: { key: CLAVE_ABONO } })
    const { porcentaje, valido } = leerPorcentajeAbono(fila?.value)
    if (!valido) {
      this.logger.warn(`${CLAVE_ABONO} = «${fila?.value}» no es un porcentaje válido: se cobra el ${porcentaje} %`)
    }
    const montoAbono = calcularAbono(total, porcentaje)
    return montoAbono > 0 ? { porcentajeAbono: porcentaje, montoAbono } : null
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
      include: { experiencia: { select: { id: true, nombre: true } }, pagos: PAGOS_PANEL },
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
    // Un cobro no se borra con su reserva: es lo que responde un reclamo o un
    // contracargo. La base ya lo impide (RESTRICT); esto es para que el panel
    // reciba un motivo y no un 500.
    const pagos = await this.prisma.pago.count({ where: { reservaId: id } })
    if (pagos > 0) {
      throw new ConflictException(
        'Tiene pagos registrados y no se puede eliminar. Cámbiale el estado a cancelado',
      )
    }
    return this.prisma.reserva.delete({ where: { id } })
  }
}

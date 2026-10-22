import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'
import { fechaReservaValida, hoyBogota, MESES_HORIZONTE_MAXIMO } from './fecha-reserva.util'
import { motivoRechazoCambio } from '../common/transiciones-estado'
import { tienePagoEnCurso } from '../pagos/estados'
import type { Bloqueo } from '../common/borrado-con-historial'
import { generarTokenConsulta, normalizarCodigo } from '../pedidos/consulta.util'
import { vistaPublicaReserva } from './consulta.util'
import { ConsultarReservaDto } from './dto/consultar-reserva.dto'
import { PagosService } from '../pagos/pagos.service'
import { PAGOS_PANEL } from '../pagos/panel'
import { venceEnDesde } from '../pagos/config'
import { calcularAbono, CLAVE_ABONO, leerPorcentajeAbono } from '../pagos/abono'


/** Lo que necesita la vista pública: la ficha (o su copia) y los intentos de pago. */
const CONSULTA_INCLUDE = {
  experiencia: { select: { nombre: true, slug: true, imagen: true } },
  pagos: { select: { referencia: true, estado: true, createdAt: true, proveedorTxId: true } },
} as const

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name)

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

  /** La página «mi reserva» por su token. 404 si no existe: no dice nada más. */
  async porToken(token: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { tokenConsulta: token }, include: CONSULTA_INCLUDE })
    if (!reserva) throw new NotFoundException()
    return vistaPublicaReserva(reserva)
  }

  /**
   * «Consultar mi reserva» con código y correo. Los dos tienen que coincidir,
   * por la misma razón que en pedidos: con solo el código se podrían recorrer
   * reservas ajenas. Una reserva anterior a los tokens recibe el suyo aquí.
   */
  async consultar(dto: ConsultarReservaDto): Promise<{ token: string }> {
    const codigo = normalizarCodigo(dto.codigo)
    if (!codigo) throw new NotFoundException()

    const reserva = await this.prisma.reserva.findFirst({
      where: {
        ...('id' in codigo ? { id: codigo.id } : { id: { endsWith: codigo.sufijo } }),
        email: { equals: dto.email.trim(), mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tokenConsulta: true },
    })
    if (!reserva) throw new NotFoundException()
    if (reserva.tokenConsulta) return { token: reserva.tokenConsulta }

    const token = generarTokenConsulta()
    await this.prisma.reserva.update({ where: { id: reserva.id }, data: { tokenConsulta: token } })
    return { token }
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
      select: { nombre: true, capacidad: true, archivada: true, precio: true },
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
        // Copia para el historial: queda aunque la experiencia se elimine.
        experienciaNombre: experiencia.nombre,
        // Va en el enlace del correo y vuelve en la respuesta, para «mi reserva».
        tokenConsulta: generarTokenConsulta(),
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
      include: {
        experiencia: { select: { id: true, nombre: true } },
        pagos: { select: { estado: true, proveedorTxId: true, createdAt: true } },
      },
    })
    if (!reserva) throw new NotFoundException()
    if (reserva.estado === dto.estado) {
      throw new BadRequestException(`La reserva ya está en ese estado`)
    }

    // El orden permitido vive en common/transiciones-estado: una cancelada o
    // vencida no se reabre, una confirmada no vuelve a pendiente (el cliente ya
    // tiene el correo) y una cuya fecha pasó ya se realizó.
    const motivo = motivoRechazoCambio('reserva', reserva.estado, dto.estado, {
      pagoEnCurso: tienePagoEnCurso(reserva.pagos, new Date()),
      // La fecha se guarda como medianoche UTC del día elegido.
      fechaPasada: reserva.fecha < new Date(hoyBogota()),
    })
    if (motivo) throw new BadRequestException(motivo)

    const updated = await this.prisma.reserva.update({
      where: { id },
      // La hora de la confirmación, para el avance de «mi reserva».
      data: { estado: dto.estado, ...(dto.estado === 'confirmada' ? { confirmadaEn: new Date() } : {}) },
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
    const reserva = await this.findById(id)
    // Un cobro no se borra con su reserva: es lo que responde un reclamo o un
    // contracargo. La base ya lo impide (RESTRICT); esto es para que el panel
    // reciba un motivo y no un 500.
    const b = await this.bloqueo(reserva)
    if (b) throw new ConflictException(b.motivo)
    return this.prisma.reserva.delete({ where: { id } })
  }

  /** Lo que el panel pregunta antes de abrir la confirmación: nulo si se puede borrar. */
  async bloqueoBorrado(id: string) {
    return (await this.bloqueo(await this.findById(id))) ?? { motivo: null }
  }

  /** Mismo formato que productos, experiencias y pedidos; aquí la que bloquea es la propia reserva. */
  private async bloqueo(reserva: { id: string; nombre: string; fecha: Date }): Promise<Bloqueo | null> {
    const pagos = await this.prisma.pago.count({ where: { reservaId: reserva.id } })
    if (pagos === 0) return null
    return {
      motivo: 'Tiene pagos registrados y no se puede eliminar. Cámbiale el estado a cancelado',
      resumen: 'Tiene pagos registrados: el cobro es lo que responde un reclamo o un contracargo. Cámbiale el estado a cancelado.',
      pendientes: [{
        id: reserva.id,
        etiqueta: `${reserva.nombre}, ${reserva.fecha.toISOString().slice(0, 10)}`,
        estado: `${pagos} ${pagos === 1 ? 'pago' : 'pagos'}`,
      }],
      restantes: 0,
    }
  }
}

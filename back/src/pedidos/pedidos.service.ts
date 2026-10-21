import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'
import { PAGOS_PANEL } from '../pagos/panel'
import { PagosService } from '../pagos/pagos.service'
import { VencimientoService } from '../pagos/vencimiento.service'
import { venceEnDesde } from '../pagos/config'
import { devolverStock } from './stock.util'
import { fechasAlPasarA } from './fechas-estado'
import { ConsultarPedidoDto } from './dto/consultar-pedido.dto'
import { generarTokenConsulta, normalizarCodigo, vistaPublica, codigoPedido } from './consulta.util'
import type { Bloqueo } from '../common/borrado-con-historial'
import { motivoRechazoCambio } from '../common/transiciones-estado'
import { tienePagoEnCurso } from '../pagos/estados'

/** Lo que necesita la vista pública: productos y pagos, sin nada del cliente. */
const CONSULTA_INCLUDE = {
  items: { include: { producto: { select: { nombre: true, imagen: true, slug: true } } } },
  pagos: { select: { referencia: true, estado: true, createdAt: true } },
} as const

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name)

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
    private pagos: PagosService,
    private vencimiento: VencimientoService,
  ) {}

  findAll() {
    return this.prisma.pedido.findMany({
      include: { items: { include: { producto: true } }, pagos: PAGOS_PANEL },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { items: { include: { producto: true } }, pagos: PAGOS_PANEL },
    })
    if (!pedido) throw new NotFoundException()
    return pedido
  }

  /** La página «mi pedido» por su token. 404 si no existe: no dice nada más. */
  async porToken(token: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { tokenConsulta: token },
      include: CONSULTA_INCLUDE,
    })
    if (!pedido) throw new NotFoundException()
    return vistaPublica(pedido)
  }

  /**
   * «Consultar mi pedido» con código y correo. Los dos tienen que coincidir:
   * con solo el código, cualquiera podría recorrer pedidos ajenos probando
   * combinaciones. Devuelve el token para abrir la página del pedido.
   *
   * Un pedido anterior a los tokens recibe el suyo aquí, la primera vez.
   */
  async consultar(dto: ConsultarPedidoDto): Promise<{ token: string }> {
    const codigo = normalizarCodigo(dto.codigo)
    // Mismo 404 para un código mal escrito y para uno que no existe: no se
    // revela qué parte falló.
    if (!codigo) throw new NotFoundException()

    const pedido = await this.prisma.pedido.findFirst({
      where: {
        ...('id' in codigo ? { id: codigo.id } : { id: { endsWith: codigo.sufijo } }),
        email: { equals: dto.email.trim(), mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tokenConsulta: true },
    })
    if (!pedido) throw new NotFoundException()
    if (pedido.tokenConsulta) return { token: pedido.tokenConsulta }

    const token = generarTokenConsulta()
    await this.prisma.pedido.update({ where: { id: pedido.id }, data: { tokenConsulta: token } })
    return { token }
  }

  async create(dto: CreatePedidoDto) {
    // `website` es el honeypot: no es columna, así que no puede llegar a Prisma.
    const { nombre, email, telefono, direccion, ciudad, codigoPostal, website } = dto

    // Bot: se responde como si hubiera salido bien, igual que en reservas.
    // Aquí importa más que en ningún otro formulario, porque cada pedido
    // aparta stock: sin esto un bot vaciaba la tienda sin pagar nada.
    if (website) {
      this.logger.warn(`Pedido descartado por honeypot: ${dto.email}`)
      return { id: 'descartado', createdAt: new Date() }
    }

    // El mismo producto en dos líneas se junta en una. Revisadas por separado,
    // dos líneas de 8 pasaban contra un stock de 10 y lo dejaban en -6.
    const items = agruparItems(dto.items)

    // Antes de revisar el stock se sueltan los pedidos que vencieron sin pago:
    // es justo cuando esas unidades hacen falta, y el backend puede haber
    // estado dormido sin que nada las devolviera. Si falla, se vende igual con
    // el stock que haya; nunca bloquea una compra.
    await this.vencimiento.vencerPendientes().catch(err =>
      this.logger.error('Vencimiento previo al pedido fallido', err instanceof Error ? err.stack : String(err)),
    )

    const cobraEnLinea = this.pagos.activo

    const pedido = await this.prisma.$transaction(async (tx) => {
      const productos = await tx.producto.findMany({
        where: { id: { in: items.map((i) => i.productoId) } },
      })
      const porId = new Map(productos.map((p) => [p.id, p]))

      for (const item of items) {
        const producto = porId.get(item.productoId)
        if (!producto) {
          throw new NotFoundException(`Producto '${item.productoId}' no encontrado`)
        }
        if (producto.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para producto '${producto.nombre}': disponible ${producto.stock}, solicitado ${item.cantidad}`,
          )
        }
      }

      // El descuento lleva la condición dentro del UPDATE, y no solo la
      // revisión de arriba: dos pedidos a la vez leen el mismo stock antes de
      // que ninguno descuente, y los dos pasarían. Con `stock >= cantidad` en
      // el WHERE el segundo no toca ninguna fila y la transacción se deshace.
      for (const item of items) {
        const { count } = await tx.producto.updateMany({
          where: { id: item.productoId, stock: { gte: item.cantidad } },
          data: { stock: { decrement: item.cantidad } },
        })
        if (count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para producto '${porId.get(item.productoId)!.nombre}'`,
          )
        }
      }

      const total = items.reduce(
        (sum, item) => sum + porId.get(item.productoId)!.precio * item.cantidad,
        0,
      )

      return tx.pedido.create({
        data: {
          nombre,
          email,
          telefono,
          direccion,
          ciudad,
          codigoPostal: codigoPostal || null,
          total,
          // Vuelve al checkout en la respuesta y va en el enlace del correo.
          tokenConsulta: generarTokenConsulta(),
          // Con pasarela, el pedido aparta el stock solo por un rato: si no se
          // paga, el vencimiento lo devuelve. Un total de cero no pasa por la
          // pasarela (no hay qué cobrar) y sigue el flujo manual.
          ...(cobraEnLinea && total > 0
            ? { estado: 'pendiente_pago', venceEn: venceEnDesde(new Date()) }
            : {}),
          items: {
            create: items.map((item) => ({
              productoId: item.productoId,
              nombre: porId.get(item.productoId)!.nombre,
              imagen: porId.get(item.productoId)!.imagen,
              cantidad: item.cantidad,
              precio: porId.get(item.productoId)!.precio,
            })),
          },
        },
        include: { items: { include: { producto: true } } },
      })
    })

    // Con cobro en línea, el aviso de «nuevo pedido» sale al aprobarse el pago
    // (PagosService): avisar ahora sería anunciar ventas que no se pagaron.
    if (pedido.estado !== 'pendiente_pago') {
      this.notificaciones
        .enviarConfirmacionPedido(pedido)
        .catch(err => this.logger.error('Notificación de pedido fallida', err))
    }

    return pedido
  }

  async update(id: string, dto: UpdatePedidoDto) {
    const actual = await this.findById(id)
    if (actual.estado === dto.estado) return actual

    // El orden permitido vive en common/transiciones-estado. Entre otras cosas:
    // un cancelado o expirado ya devolvió sus unidades y no se reabre (un
    // expirado solo vuelve solo, si llega su pago: ver PagosService), y con un
    // pago en curso en el banco no se marca pagado ni se cancela a mano.
    const motivo = motivoRechazoCambio('pedido', actual.estado, dto.estado, {
      pagoEnCurso: tienePagoEnCurso(actual.pagos, new Date()),
      fechaPasada: false,
    })
    if (motivo) throw new BadRequestException(motivo)

    return this.prisma.$transaction(async (tx) => {
      // Al crear el pedido se descontó el stock; si no se va a vender, vuelve.
      // Sin esto cada pedido cancelado dejaba unidades fantasma fuera de la
      // tienda. `devolverStock` mira `stockApartado` y no el estado: un pedido
      // en revisión puede tenerlas o no según por qué llegó ahí.
      if (dto.estado === 'cancelado') {
        await devolverStock(tx, id, actual.items)
      }
      return tx.pedido.update({
        where: { id },
        // La hora de cada paso, para el avance de «mi pedido».
        data: { estado: dto.estado, ...fechasAlPasarA(dto.estado, actual) },
        include: { items: { include: { producto: true } }, pagos: PAGOS_PANEL },
      })
    })
  }

  async remove(id: string) {
    const pedido = await this.findById(id)
    // Un cobro no se borra con su pedido: es lo que responde un reclamo o un
    // contracargo. La base ya lo impide (RESTRICT); esto es para que el panel
    // reciba un motivo y no un 500.
    const b = await this.bloqueo(id)
    if (b) throw new ConflictException(b.motivo)
    // Sus líneas no tienen sentido sin él y la base no deja borrarlo con ellas.
    return this.prisma.$transaction(async (tx) => {
      // Lo que no salió de la finca vuelve a la tienda, como al cancelarlo.
      // Lo enviado o entregado ya no está en bodega.
      if (pedido.estado !== 'enviado' && pedido.estado !== 'entregado') {
        await devolverStock(tx, id, pedido.items)
      }
      await tx.itemPedido.deleteMany({ where: { pedidoId: id } })
      return tx.pedido.delete({ where: { id } })
    })
  }

  /** Lo que el panel pregunta antes de abrir la confirmación: nulo si se puede borrar. */
  async bloqueoBorrado(id: string) {
    await this.findById(id)
    return (await this.bloqueo(id)) ?? { motivo: null }
  }

  /** Mismo formato que productos y experiencias; aquí el único que bloquea es el propio pedido. */
  private async bloqueo(id: string): Promise<Bloqueo | null> {
    const pagos = await this.prisma.pago.count({ where: { pedidoId: id } })
    if (pagos === 0) return null
    return {
      motivo: 'Tiene pagos registrados y no se puede eliminar. Cámbiale el estado a cancelado',
      resumen: 'Tiene pagos registrados: el cobro es lo que responde un reclamo o un contracargo. Cámbiale el estado a cancelado.',
      pendientes: [{ id, etiqueta: codigoPedido(id), estado: `${pagos} ${pagos === 1 ? 'pago' : 'pagos'}` }],
      restantes: 0,
    }
  }
}

/** Junta las líneas del mismo producto sumando sus cantidades. */
export function agruparItems<T extends { productoId: string; cantidad: number }>(
  items: T[],
): { productoId: string; cantidad: number }[] {
  const suma = new Map<string, number>()
  for (const { productoId, cantidad } of items) {
    suma.set(productoId, (suma.get(productoId) ?? 0) + cantidad)
  }
  return [...suma].map(([productoId, cantidad]) => ({ productoId, cantidad }))
}

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name)

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  findAll() {
    return this.prisma.pedido.findMany({
      include: { items: { include: { producto: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { items: { include: { producto: true } } },
    })
    if (!pedido) throw new NotFoundException()
    return pedido
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
          codigoPostal,
          total,
          items: {
            create: items.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precio: porId.get(item.productoId)!.precio,
            })),
          },
        },
        include: { items: { include: { producto: true } } },
      })
    })

    this.notificaciones
      .enviarConfirmacionPedido(pedido)
      .catch(err => this.logger.error('Notificación de pedido fallida', err))

    return pedido
  }

  async update(id: string, dto: UpdatePedidoDto) {
    const actual = await this.findById(id)
    if (actual.estado === dto.estado) return actual

    // Un pedido cancelado ya devolvió sus unidades al inventario. Sacarlo de
    // ahí obligaría a volver a apartarlas, y puede que ya no estén: se hace un
    // pedido nuevo, igual que una reserva cancelada no se reabre.
    if (actual.estado === 'cancelado') {
      throw new BadRequestException(
        `No se puede cambiar el estado de "cancelado" a "${dto.estado}"`,
      )
    }

    return this.prisma.$transaction(async (tx) => {
      // Al crear el pedido se descontó el stock; si no se va a vender, vuelve.
      // Sin esto cada pedido cancelado dejaba unidades fantasma fuera de la tienda.
      if (dto.estado === 'cancelado') {
        for (const item of actual.items) {
          await tx.producto.update({
            where: { id: item.productoId },
            data: { stock: { increment: item.cantidad } },
          })
        }
      }
      return tx.pedido.update({
        where: { id },
        data: { estado: dto.estado },
        include: { items: { include: { producto: true } } },
      })
    })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.pedido.delete({ where: { id } })
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

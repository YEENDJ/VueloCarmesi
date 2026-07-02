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
    const { nombre, email, telefono, direccion, ciudad, codigoPostal, items } = dto

    // Create pedido with items in a transaction (stock fetch + validation inside to avoid race condition)
    const pedido = await this.prisma.$transaction(async (tx) => {
      // Fetch all products inside the transaction
      const productIds = items.map((i) => i.productoId)
      const productos = await tx.producto.findMany({
        where: { id: { in: productIds } },
      })

      // Validate all products exist and have sufficient stock
      for (const item of items) {
        const producto = productos.find((p) => p.id === item.productoId)
        if (!producto) {
          throw new NotFoundException(`Producto '${item.productoId}' no encontrado`)
        }
        if (producto.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para producto '${producto.nombre}': disponible ${producto.stock}, solicitado ${item.cantidad}`,
          )
        }
      }

      // Calculate total
      const total = items.reduce((sum, item) => {
        const producto = productos.find((p) => p.id === item.productoId)!
        return sum + producto.precio * item.cantidad
      }, 0)

      const pedido = await tx.pedido.create({
        data: {
          nombre,
          email,
          telefono,
          direccion,
          ciudad,
          codigoPostal,
          total,
          items: {
            create: items.map((item) => {
              const producto = productos.find((p) => p.id === item.productoId)!
              return {
                productoId: item.productoId,
                cantidad: item.cantidad,
                precio: producto.precio,
              }
            }),
          },
        },
        include: { items: { include: { producto: true } } },
      })

      // Decrement stock for each product
      for (const item of items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        })
      }

      return pedido
    })

    this.notificaciones
      .enviarConfirmacionPedido(pedido)
      .catch(err => this.logger.error('Notificación de pedido fallida', err))

    return pedido
  }

  async update(id: string, dto: UpdatePedidoDto) {
    await this.findById(id)
    return this.prisma.pedido.update({
      where: { id },
      data: { estado: dto.estado },
      include: { items: { include: { producto: true } } },
    })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.pedido.delete({ where: { id } })
  }
}

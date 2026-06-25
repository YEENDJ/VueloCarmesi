import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

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
    const { nombre, email, direccion, items } = dto

    // Create pedido with items in a transaction (stock fetch + validation inside to avoid race condition)
    return this.prisma.$transaction(async (tx) => {
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
          direccion,
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
  }

  async update(id: string, dto: UpdatePedidoDto) {
    await this.findById(id)
    return this.prisma.pedido.update({ where: { id }, data: { estado: dto.estado } })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.pedido.delete({ where: { id } })
  }
}

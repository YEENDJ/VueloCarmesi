import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateProductoDto } from './dto/create-producto.dto'

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.producto.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findBySlug(slug: string) {
    const producto = await this.prisma.producto.findUnique({ where: { slug } })
    if (!producto) throw new NotFoundException(`Producto '${slug}' no encontrado`)
    return producto
  }

  async findById(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } })
    if (!producto) throw new NotFoundException()
    return producto
  }

  create(dto: CreateProductoDto) {
    return this.prisma.producto.create({ data: dto })
  }

  async update(id: string, dto: Partial<CreateProductoDto>) {
    const existing = await this.findById(id)
    if (dto.stock !== undefined && dto.stock < 0) {
      throw new BadRequestException('El stock no puede quedar negativo')
    }
    if (dto.stock !== undefined) {
      const newStock = existing.stock + dto.stock
      if (newStock < 0) {
        throw new BadRequestException('El stock no puede quedar negativo')
      }
    }
    return this.prisma.producto.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.producto.delete({ where: { id } })
  }
}

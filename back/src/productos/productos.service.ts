import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { toSlug, slugUnico } from '../common/slug'
import { CreateProductoDto } from './dto/create-producto.dto'
import { UpdateProductoDto } from './dto/update-producto.dto'

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

  async create(dto: CreateProductoDto) {
    const nombre = dto.nombre.trim()
    return this.prisma.producto.create({
      data: { ...dto, nombre, slug: await this.slugLibre(nombre) },
    })
  }

  async update(id: string, dto: UpdateProductoDto) {
    await this.findById(id)
    if (dto.stock !== undefined && dto.stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo')
    }
    const data: UpdateProductoDto & { slug?: string } = { ...dto }
    // El slug se regenera al cambiar el nombre: es la única vía para corregir
    // uno mal formado ahora que el panel no lo edita. Ojo, cambia la URL pública.
    if (dto.nombre !== undefined) {
      data.nombre = dto.nombre.trim()
      data.slug = await this.slugLibre(data.nombre, id)
    }
    return this.prisma.producto.update({ where: { id }, data })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.producto.delete({ where: { id } })
  }

  /** `ignorarId` evita que un registro choque consigo mismo al editarse. */
  private slugLibre(nombre: string, ignorarId?: string) {
    return slugUnico(toSlug(nombre), async slug => {
      const dueno = await this.prisma.producto.findUnique({
        where: { slug },
        select: { id: true },
      })
      return dueno !== null && dueno.id !== ignorarId
    })
  }
}

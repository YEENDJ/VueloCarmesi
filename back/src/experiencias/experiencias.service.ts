import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { toSlug, slugUnico } from '../common/slug'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'

@Injectable()
export class ExperienciasService {
  constructor(private prisma: PrismaService) {}

  findAll(soloDestacadas = false) {
    return this.prisma.experiencia.findMany({
      ...(soloDestacadas ? { where: { destacada: true } } : {}),
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async findBySlug(slug: string) {
    const exp = await this.prisma.experiencia.findUnique({ where: { slug } })
    if (!exp) throw new NotFoundException(`Experiencia '${slug}' no encontrada`)
    return exp
  }

  async findById(id: string) {
    const exp = await this.prisma.experiencia.findUnique({ where: { id } })
    if (!exp) throw new NotFoundException()
    return exp
  }

  async create(dto: CreateExperienciaDto) {
    const nombre = dto.nombre.trim()
    return this.prisma.experiencia.create({
      data: { ...dto, nombre, slug: await this.slugLibre(nombre) },
    })
  }

  async update(id: string, dto: Partial<CreateExperienciaDto>) {
    await this.findById(id)
    const data: Partial<CreateExperienciaDto> & { slug?: string } = { ...dto }
    // El slug se regenera al cambiar el nombre: es la única vía para corregir
    // uno mal formado ahora que el panel no lo edita. Ojo, cambia la URL pública.
    if (dto.nombre !== undefined) {
      data.nombre = dto.nombre.trim()
      data.slug = await this.slugLibre(data.nombre, id)
    }
    return this.prisma.experiencia.update({ where: { id }, data })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.experiencia.delete({ where: { id } })
  }

  /** `ignorarId` evita que un registro choque consigo mismo al editarse. */
  private slugLibre(nombre: string, ignorarId?: string) {
    return slugUnico(toSlug(nombre), async slug => {
      const dueno = await this.prisma.experiencia.findUnique({
        where: { slug },
        select: { id: true },
      })
      return dueno !== null && dueno.id !== ignorarId
    })
  }
}

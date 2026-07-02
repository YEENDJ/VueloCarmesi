import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
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

  create(dto: CreateExperienciaDto) {
    return this.prisma.experiencia.create({ data: dto })
  }

  async update(id: string, dto: Partial<CreateExperienciaDto>) {
    await this.findById(id)
    return this.prisma.experiencia.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.experiencia.delete({ where: { id } })
  }
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateReservaDto } from './dto/create-reserva.dto'

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.reserva.findMany({
      include: { experiencia: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } })
    if (!reserva) throw new NotFoundException()
    return reserva
  }

  create(dto: CreateReservaDto) {
    const { fecha, ...rest } = dto
    return this.prisma.reserva.create({
      data: {
        ...rest,
        fecha: new Date(fecha),
      },
    })
  }

  async update(id: string, dto: Partial<CreateReservaDto>) {
    await this.findById(id)
    const { fecha, ...rest } = dto
    return this.prisma.reserva.update({
      where: { id },
      data: {
        ...rest,
        ...(fecha ? { fecha: new Date(fecha) } : {}),
      },
    })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.reserva.delete({ where: { id } })
  }
}

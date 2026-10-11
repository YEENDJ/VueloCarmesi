import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { Ave } from '@prisma/client'
import { PrismaService } from '../prisma.service'
import { TraduccionService } from '../traduccion/traduccion.service'
import { IDIOMA_ORIGEN } from '../traduccion/campos'
import { CreateAveDto } from './dto/create-ave.dto'
import { OrdenAvesDto, UpdateAveDto } from './dto/update-ave.dto'

@Injectable()
export class AvesService {
  constructor(
    private prisma: PrismaService,
    private traduccion: TraduccionService,
  ) {}

  /**
   * Sin idioma devuelve las filas tal cual, con `alt` y `altEn`: es lo que
   * edita el panel. Con `en`, el `alt` ya viene en inglés, que es lo único de
   * la especie que cambia con el idioma.
   */
  async findAll(idioma?: string) {
    const filas = await this.prisma.ave.findMany({ orderBy: [{ tipo: 'desc' }, { orden: 'asc' }] })
    if (!idioma || idioma === IDIOMA_ORIGEN) return filas
    // Si DeepL no estaba cuando se guardó, mejor el alt en español que vacío.
    return filas.map(f => ({ ...f, alt: f.altEn || f.alt }))
  }

  async findById(id: string) {
    const ave = await this.prisma.ave.findUnique({ where: { id } })
    if (!ave) throw new NotFoundException()
    return ave
  }

  async create(dto: CreateAveDto) {
    exigirFotoSiResidente(dto.tipo, dto.imagen)
    const ultima = await this.prisma.ave.findFirst({
      where: { tipo: dto.tipo },
      orderBy: { orden: 'desc' },
      select: { orden: true },
    })
    const alt = dto.alt?.trim() ?? ''
    const altEn = dto.altEn?.trim() || (await this.traducirAlt(alt))

    return this.guardando(() =>
      this.prisma.ave.create({
        data: {
          ...dto,
          cientifico: dto.cientifico.trim(),
          alt,
          altEn,
          // Al final de su grupo: una especie nueva no debería desplazar a las
          // que ya estaban ordenadas a mano.
          orden: (ultima?.orden ?? 0) + 1,
        },
      }),
    )
  }

  async update(id: string, dto: UpdateAveDto) {
    const previa = await this.findById(id)
    exigirFotoSiResidente(dto.tipo ?? previa.tipo, dto.imagen ?? previa.imagen)

    const data: UpdateAveDto = { ...dto }
    if (dto.cientifico !== undefined) data.cientifico = dto.cientifico.trim()
    if (dto.alt !== undefined) data.alt = dto.alt.trim()

    // El inglés se rehace cuando el español cambió y nadie tocó el inglés, o
    // cuando quedó vacío. Si el admin escribió el inglés a mano en el mismo
    // guardado, se respeta: es una corrección, no algo que pisar.
    const altNuevo = data.alt ?? previa.alt
    const altEnTocado = dto.altEn !== undefined && dto.altEn.trim() !== previa.altEn
    const espanolCambio = altNuevo !== previa.alt
    const altEnFinal = dto.altEn !== undefined ? dto.altEn.trim() : previa.altEn
    if ((espanolCambio && !altEnTocado) || !altEnFinal) {
      data.altEn = await this.traducirAlt(altNuevo)
    } else if (dto.altEn !== undefined) {
      data.altEn = altEnFinal
    }

    return this.guardando(() => this.prisma.ave.update({ where: { id }, data }))
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.ave.delete({ where: { id } })
  }

  /** Reescribe el orden de un grupo con la lista que manda el panel, de 1 en adelante. */
  async reordenar({ ids }: OrdenAvesDto) {
    await this.prisma.$transaction(
      ids.map((id, i) => this.prisma.ave.update({ where: { id }, data: { orden: i + 1 } })),
    )
    return this.findAll()
  }

  /** Nunca lanza: sin DeepL se guarda el alt vacío y la página cae al español. */
  private async traducirAlt(alt: string): Promise<string> {
    if (!alt) return ''
    const res = await this.traduccion.traducir({ alt }, ['alt'], [])
    const traducido = res?.campos.alt
    return typeof traducido === 'string' ? traducido : ''
  }

  /** El nombre científico es único: un duplicado es un 409 con motivo, no un 500. */
  private async guardando(op: () => Promise<Ave>): Promise<Ave> {
    try {
      return await op()
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Ya hay una especie con ese nombre científico')
      }
      throw err
    }
  }
}

/**
 * Una residente sin foto dejaría un marco vacío en la rejilla. Las migratorias
 * van sin foto por regla (ver el modelo), así que a ellas no se les pide.
 */
function exigirFotoSiResidente(tipo: string, imagen?: string) {
  if (tipo === 'residente' && !imagen?.trim()) {
    throw new BadRequestException('Las especies residentes necesitan foto')
  }
}

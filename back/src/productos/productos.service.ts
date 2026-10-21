import type { Prisma } from '@prisma/client'
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'
import { aplicarTraduccion } from '../traduccion/aplicar-traduccion'
import { IDIOMA_ORIGEN, TEXTO_PRODUCTO, LISTA_PRODUCTO } from '../traduccion/campos'
import { HistorialSlugs } from '../slugs/historial-slugs.service'
import { capitalizarNombre } from '../common/nombre'
import { portadaDe } from '../common/portada'
import { PEDIDO_EN_CURSO, bloqueo } from '../common/borrado-con-historial'
import { codigoPedido } from '../pedidos/consulta.util'
import { CreateProductoDto } from './dto/create-producto.dto'
import { UpdateProductoDto } from './dto/update-producto.dto'

const CAMPOS_PRODUCTO = [...TEXTO_PRODUCTO, ...LISTA_PRODUCTO]

@Injectable()
export class ProductosService {
  constructor(
    private prisma: PrismaService,
    private traduccion: SincronizadorTraduccion,
    private slugs: HistorialSlugs,
  ) {}

  async findAll(idioma = IDIOMA_ORIGEN) {
    const filas = await this.prisma.producto.findMany({
      orderBy: { createdAt: 'desc' },
      include: { traducciones: true },
    })
    return filas.map(f => aplicarTraduccion(f, idioma, CAMPOS_PRODUCTO))
  }

  /**
   * Ver experiencias.service: resuelve el slug en cualquiera de los idiomas y,
   * si no es vigente, en el historial de URLs viejas, para que la ficha
   * redirija con 308.
   */
  async findBySlug(slug: string, idioma = IDIOMA_ORIGEN) {
    const porOriginal = await this.prisma.producto.findUnique({
      where: { slug },
      include: { traducciones: true },
    })
    if (porOriginal) return aplicarTraduccion(porOriginal, idioma, CAMPOS_PRODUCTO)

    const traduccion = await this.prisma.productoTraduccion.findFirst({
      where: { slug },
      include: { producto: { include: { traducciones: true } } },
    })
    if (traduccion) return aplicarTraduccion(traduccion.producto, idioma, CAMPOS_PRODUCTO)

    const duenoAnterior = await this.slugs.duenoAnterior('producto', slug)
    if (duenoAnterior) {
      const vigente = await this.prisma.producto.findUnique({
        where: { id: duenoAnterior },
        include: { traducciones: true },
      })
      if (vigente) return aplicarTraduccion(vigente, idioma, CAMPOS_PRODUCTO)
    }

    throw new NotFoundException(`Producto '${slug}' no encontrado`)
  }

  async findById(id: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id } })
    if (!producto) throw new NotFoundException()
    return producto
  }

  async create(dto: CreateProductoDto) {
    const nombre = capitalizarNombre(dto.nombre)
    const creado = await this.prisma.producto.create({
      data: {
        ...dto,
        nombre,
        slug: await this.slugs.libre('producto', nombre),
        // Ver experiencias.service: la portada se deriva, no se edita aparte.
        imagen: portadaDe(dto.imagenes),
      },
    })
    // Ver experiencias.service: se espera la traducción para que la purga de
    // caché del panel encuentre los dos idiomas ya guardados.
    await this.traduccion.producto(creado.id)
    return creado
  }

  async update(id: string, dto: UpdateProductoDto) {
    await this.findById(id)
    if (dto.stock !== undefined && dto.stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo')
    }
    const data: UpdateProductoDto = { ...dto }
    // Ver experiencias.service: renombrar no toca el slug, y no hay otra vía
    // para cambiarlo.
    if (dto.nombre !== undefined) {
      data.nombre = capitalizarNombre(dto.nombre)
    }
    // Un PATCH de solo stock no debe tocar la portada; solo si viene galería.
    if (dto.imagenes !== undefined) {
      (data as { imagen?: string }).imagen = portadaDe(dto.imagenes)
    }
    const actualizado = await this.prisma.producto.update({ where: { id }, data })

    // Un PATCH de solo stock no gasta ni una llamada: no cambió ningún texto.
    await this.traduccion.producto(id)
    return actualizado
  }

  /**
   * Los pedidos ya cerrados se quedan con la copia del nombre e imagen; los que
   * faltan por despachar bloquean el borrado. Ver common/borrado-con-historial.
   */
  async remove(id: string) {
    await this.findById(id)
    return this.prisma.$transaction(async (tx) => {
      // Bloquea la fila: un pedido que entra mientras tanto espera a que esto
      // termine, y entonces ya no encuentra el producto. Sin esto podía quedar
      // un pedido nuevo, por despachar, apuntando a nada.
      await tx.$queryRaw`SELECT id FROM "Producto" WHERE id = ${id} FOR UPDATE`
      const b = await this.bloqueo(id, tx)
      if (b) throw new ConflictException(b.motivo)
      return tx.producto.delete({ where: { id } })
    })
  }

  /** Lo que el panel pregunta antes de abrir la confirmación: nulo si se puede borrar. */
  async bloqueoBorrado(id: string) {
    await this.findById(id)
    return (await this.bloqueo(id)) ?? { motivo: null }
  }

  private async bloqueo(id: string, db: Prisma.TransactionClient = this.prisma) {
    const enCurso = await db.pedido.findMany({
      where: { estado: { in: PEDIDO_EN_CURSO }, items: { some: { productoId: id } } },
      select: { id: true, estado: true },
      orderBy: { createdAt: 'asc' },
    })
    return bloqueo(
      'pedidos sin despachar',
      'Despáchalos o cancélalos y vuelve a intentarlo',
      enCurso.map(p => ({ id: p.id, etiqueta: codigoPedido(p.id), estado: p.estado })),
    )
  }
}

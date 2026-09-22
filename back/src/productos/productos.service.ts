import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'
import { aplicarTraduccion } from '../traduccion/aplicar-traduccion'
import { IDIOMA_ORIGEN, TEXTO_PRODUCTO, LISTA_PRODUCTO } from '../traduccion/campos'
import { toSlug, slugUnico } from '../common/slug'
import { capitalizarNombre } from '../common/nombre'
import { portadaDe } from '../common/portada'
import { CreateProductoDto } from './dto/create-producto.dto'
import { UpdateProductoDto } from './dto/update-producto.dto'

const CAMPOS_PRODUCTO = [...TEXTO_PRODUCTO, ...LISTA_PRODUCTO]

@Injectable()
export class ProductosService {
  constructor(
    private prisma: PrismaService,
    private traduccion: SincronizadorTraduccion,
  ) {}

  async findAll(idioma = IDIOMA_ORIGEN) {
    const filas = await this.prisma.producto.findMany({
      orderBy: { createdAt: 'desc' },
      include: { traducciones: true },
    })
    return filas.map(f => aplicarTraduccion(f, idioma, CAMPOS_PRODUCTO))
  }

  /** Ver experiencias.service: resuelve el slug en cualquiera de los idiomas. */
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
        slug: await this.slugLibre(nombre),
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
    const data: UpdateProductoDto & { slug?: string } = { ...dto }
    // El slug se regenera al cambiar el nombre: es la única vía para corregir
    // uno mal formado ahora que el panel no lo edita. Ojo, cambia la URL pública.
    if (dto.nombre !== undefined) {
      data.nombre = capitalizarNombre(dto.nombre)
      data.slug = await this.slugLibre(data.nombre, id)
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

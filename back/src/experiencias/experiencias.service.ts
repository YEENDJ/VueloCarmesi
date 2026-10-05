import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'
import { aplicarTraduccion } from '../traduccion/aplicar-traduccion'
import { IDIOMA_ORIGEN, TEXTO_EXPERIENCIA, LISTA_EXPERIENCIA } from '../traduccion/campos'
import { HistorialSlugs } from '../slugs/historial-slugs.service'
import { capitalizarNombre } from '../common/nombre'
import { portadaDe } from '../common/portada'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'
import { UpdateExperienciaDto } from './dto/update-experiencia.dto'
import { CambiarSlugDto } from '../slugs/cambiar-slug.dto'

/** Los campos que la lectura funde con la traducción: texto y listas juntos. */
const CAMPOS_EXPERIENCIA = [...TEXTO_EXPERIENCIA, ...LISTA_EXPERIENCIA]

@Injectable()
export class ExperienciasService {
  constructor(
    private prisma: PrismaService,
    private traduccion: SincronizadorTraduccion,
    private slugs: HistorialSlugs,
  ) {}

  async findAll(soloDestacadas = false, idioma = IDIOMA_ORIGEN) {
    const filas = await this.prisma.experiencia.findMany({
      ...(soloDestacadas ? { where: { destacada: true } } : {}),
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
      include: { traducciones: true },
    })
    return filas.map(f => aplicarTraduccion(f, idioma, CAMPOS_EXPERIENCIA))
  }

  /**
   * Busca por slug en cualquiera de los dos idiomas.
   *
   * La ficha vive en dos URLs —/experiencias/experiencia-cacaotera y
   * /en/experiences/cacao-experience— y las dos tienen que resolver. Además,
   * un enlace compartido antes de que existiera el inglés sigue llegando con el
   * slug español bajo /en: si solo mirásemos el slug del idioma pedido, ese
   * enlace daría 404 justo cuando alguien lo acaba de reenviar a un amigo.
   *
   * Si no es un slug vigente se busca entre los anteriores, y la ficha vuelve
   * con su slug de hoy. La página compara ese slug con el de la URL y, como no
   * coinciden, responde 308 a la buena: la URL vieja conserva su
   * posicionamiento en vez de caer en un 404.
   */
  async findBySlug(slug: string, idioma = IDIOMA_ORIGEN) {
    const porOriginal = await this.prisma.experiencia.findUnique({
      where: { slug },
      include: { traducciones: true },
    })
    if (porOriginal) return aplicarTraduccion(porOriginal, idioma, CAMPOS_EXPERIENCIA)

    const traduccion = await this.prisma.experienciaTraduccion.findFirst({
      where: { slug },
      include: { experiencia: { include: { traducciones: true } } },
    })
    if (traduccion) {
      return aplicarTraduccion(traduccion.experiencia, idioma, CAMPOS_EXPERIENCIA)
    }

    const duenoAnterior = await this.slugs.duenoAnterior('experiencia', slug)
    if (duenoAnterior) {
      const vigente = await this.prisma.experiencia.findUnique({
        where: { id: duenoAnterior },
        include: { traducciones: true },
      })
      if (vigente) return aplicarTraduccion(vigente, idioma, CAMPOS_EXPERIENCIA)
    }

    throw new NotFoundException(`Experiencia '${slug}' no encontrada`)
  }

  async findById(id: string) {
    const exp = await this.prisma.experiencia.findUnique({ where: { id } })
    if (!exp) throw new NotFoundException()
    return exp
  }

  async create(dto: CreateExperienciaDto) {
    const nombre = capitalizarNombre(dto.nombre)
    const creada = await this.prisma.experiencia.create({
      data: {
        ...dto,
        nombre,
        slug: await this.slugs.libre('experiencia', nombre),
        // `imagen` nunca llega del panel: se deriva de la galería para que la
        // portada y la lista no puedan quedar contradiciéndose.
        imagen: portadaDe(dto.imagenes),
      },
    })

    // Se espera la traducción antes de responder, no se dispara al aire.
    //
    // El panel purga la caché del front justo después de que esto devuelve: si
    // la traducción fuera en segundo plano, la purga ocurriría antes de que
    // exista el inglés, el front recachearía sin él y la versión inglesa no
    // aparecería hasta el siguiente ciclo de revalidación. Cuesta ~1,5 s de
    // spinner y a cambio la ficha nace publicada en los dos idiomas.
    await this.traduccion.experiencia(creada.id)
    return creada
  }

  async update(id: string, dto: UpdateExperienciaDto) {
    await this.findById(id)
    const data: UpdateExperienciaDto = { ...dto }
    // Renombrar NO toca el slug. Antes se regeneraba con el nombre y cada
    // corrección de una tilde mataba la URL que Google ya tenía indexada y los
    // enlaces que circulaban por WhatsApp. Cambiar la URL es ahora una acción
    // aparte, `cambiarSlug`, que además deja la vieja redirigiendo.
    if (dto.nombre !== undefined) {
      data.nombre = capitalizarNombre(dto.nombre)
    }
    // Solo se recalcula si la edición trae galería: un PATCH de un único campo
    // (destacada, archivada) no debe borrar la portada existente.
    if (dto.imagenes !== undefined) {
      (data as { imagen?: string }).imagen = portadaDe(dto.imagenes)
    }
    const actualizada = await this.prisma.experiencia.update({ where: { id }, data })

    // Solo se llama a DeepL si cambió texto: el sincronizador compara las
    // huellas guardadas y, si el PATCH solo traía `destacada` o `archivada`,
    // no hay nada que traducir y esto vuelve sin salir a la red.
    await this.traduccion.experiencia(id)
    return actualizada
  }

  /**
   * Cambia a propósito la URL de la ficha en un idioma. La anterior queda en
   * el historial y sigue resolviendo, así que el front la redirige con un 308.
   *
   * Devuelve la ficha en español con `slugs` de los dos idiomas, que es lo que
   * el panel necesita para mostrar las URLs que quedaron.
   */
  async cambiarSlug(id: string, dto: CambiarSlugDto) {
    await this.findById(id)
    await this.slugs.cambiar('experiencia', id, dto.idioma ?? IDIOMA_ORIGEN, dto.slug)
    const fila = await this.prisma.experiencia.findUniqueOrThrow({
      where: { id },
      include: { traducciones: true },
    })
    return aplicarTraduccion(fila, IDIOMA_ORIGEN, CAMPOS_EXPERIENCIA)
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.experiencia.delete({ where: { id } })
  }
}

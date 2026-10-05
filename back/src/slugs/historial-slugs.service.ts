import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { toSlug, slugUnico } from '../common/slug'
import { IDIOMA_ORIGEN } from '../traduccion/campos'

export type EntidadConSlug = 'experiencia' | 'producto'

/**
 * Lo que diferencia a experiencias de productos para este servicio: en qué
 * tablas vive cada slug. Todo lo demás —qué cuenta como ocupado, cómo se
 * guarda el anterior— es igual para las dos, y por eso vive una sola vez.
 *
 * Funciones explícitas por entidad y no un `prisma[tabla]` dinámico: así cada
 * consulta conserva su tipo y un campo mal escrito no compila.
 */
interface Tablas {
  /** Dueño del slug vigente en español. */
  vigenteOrigen(slug: string): Promise<string | null>
  /** Dueño del slug vigente en cualquier traducción. */
  vigenteTraduccion(slug: string): Promise<string | null>
  /** Dueño de un slug anterior, en cualquier idioma. El más reciente si hubiera dos. */
  anterior(slug: string): Promise<string | null>
  /** El slug vigente de una ficha en un idioma. `null` si no tiene versión en ese idioma. */
  actual(id: string, idioma: string): Promise<string | null>
  /** Guarda `nuevo` como vigente y `viejo` en el historial, todo o nada. */
  reemplazar(id: string, idioma: string, viejo: string, nuevo: string): Promise<void>
}

/**
 * El historial de URLs de las fichas.
 *
 * El slug es la URL pública, y desde que existe esto se trata como tal: nace
 * una vez, al crear la ficha, y no se mueve aunque cambie el nombre. Si hay que
 * corregirlo se hace con `cambiar()`, que es una acción aparte en el panel y
 * deja el anterior guardado para que siga respondiendo con un 308 a la URL
 * nueva. Antes el slug se regeneraba con cada renombre y la URL vieja moría en
 * silencio; la única red era una lista escrita a mano en el front.
 */
@Injectable()
export class HistorialSlugs {
  constructor(private prisma: PrismaService) {}

  /**
   * ¿Lo usa OTRA ficha de la misma entidad, ahora o antes, en cualquier idioma?
   *
   * En cualquier idioma porque `findBySlug` resuelve sin mirar el idioma de la
   * URL —un enlace con el slug español bajo /en tiene que funcionar—, así que
   * un mismo slug en dos fichas distintas haría que una de las dos fuese
   * inalcanzable desde la otra lengua.
   *
   * Y también los anteriores: darle a una ficha nueva la URL vieja de otra
   * secuestraría los enlaces que Google y la gente todavía tienen de aquella.
   */
  async ocupado(entidad: EntidadConSlug, slug: string, propioId?: string): Promise<boolean> {
    const t = this.tablas(entidad)
    const duenos = await Promise.all([
      t.vigenteOrigen(slug),
      t.vigenteTraduccion(slug),
      t.anterior(slug),
    ])
    return duenos.some(dueno => dueno !== null && dueno !== propioId)
  }

  /** Slug libre derivado de un nombre. Solo para fichas o traducciones que nacen. */
  libre(entidad: EntidadConSlug, nombre: string, propioId?: string): Promise<string> {
    return slugUnico(toSlug(nombre), slug => this.ocupado(entidad, slug, propioId))
  }

  /** El id de la ficha que usó este slug y ya no lo usa, o `null`. */
  duenoAnterior(entidad: EntidadConSlug, slug: string): Promise<string | null> {
    return this.tablas(entidad).anterior(slug)
  }

  /**
   * Cambia a propósito el slug de una ficha en un idioma y guarda el anterior.
   *
   * Lo pedido pasa por `toSlug`: desde el panel se puede escribir «Ruta del
   * Cacao» y se guarda `ruta-del-cacao`, igual que al crear. Si choca no se le
   * añade sufijo, a diferencia de `libre()`: quien cambia una URL a mano la
   * quiere exactamente así, y un `-2` que no pidió es peor que un aviso.
   *
   * Devuelve el slug que quedó vigente.
   */
  async cambiar(
    entidad: EntidadConSlug,
    id: string,
    idioma: string,
    pedido: string,
  ): Promise<string> {
    const nuevo = toSlug(pedido)
    if (!nuevo) {
      throw new BadRequestException('La dirección necesita al menos una letra o un número')
    }

    const t = this.tablas(entidad)
    const actual = await t.actual(id, idioma)
    if (actual === null) {
      // El slug inglés vive en la fila de traducción. Si todavía no existe, no
      // hay URL inglesa que cambiar: la ficha se sirve con el slug español.
      throw new BadRequestException('Esta ficha todavía no tiene versión en ese idioma')
    }
    if (actual === nuevo) return actual

    if (await this.ocupado(entidad, nuevo, id)) {
      throw new ConflictException(`La dirección «${nuevo}» ya es o fue de otra ficha`)
    }

    await t.reemplazar(id, idioma, actual, nuevo)
    return nuevo
  }

  private tablas(entidad: EntidadConSlug): Tablas {
    return entidad === 'experiencia' ? this.tablasExperiencia() : this.tablasProducto()
  }

  private tablasExperiencia(): Tablas {
    const p = this.prisma
    return {
      vigenteOrigen: slug =>
        p.experiencia.findUnique({ where: { slug }, select: { id: true } }).then(r => r?.id ?? null),
      vigenteTraduccion: slug =>
        p.experienciaTraduccion
          .findFirst({ where: { slug }, select: { experienciaId: true } })
          .then(r => r?.experienciaId ?? null),
      anterior: slug =>
        p.experienciaSlugAnterior
          .findFirst({ where: { slug }, orderBy: { creadoEn: 'desc' }, select: { experienciaId: true } })
          .then(r => r?.experienciaId ?? null),
      actual: async (id, idioma) => {
        if (idioma === IDIOMA_ORIGEN) {
          const exp = await p.experiencia.findUnique({ where: { id }, select: { slug: true } })
          return exp?.slug ?? null
        }
        const tr = await p.experienciaTraduccion.findUnique({
          where: { experienciaId_idioma: { experienciaId: id, idioma } },
          select: { slug: true },
        })
        return tr ? tr.slug : null
      },
      reemplazar: async (id, idioma, viejo, nuevo) => {
        await p.$transaction([
          // Si el nuevo es un slug que esta misma ficha tuvo antes, deja de ser
          // «anterior» y vuelve a ser el vigente. `ocupado()` ya descartó que
          // fuese de otra ficha, así que esto solo puede borrar uno propio.
          p.experienciaSlugAnterior.deleteMany({ where: { idioma, slug: nuevo } }),
          // Una traducción vieja puede tener el slug vacío: no hay URL que guardar.
          ...(viejo
            ? [p.experienciaSlugAnterior.upsert({
                where: { idioma_slug: { idioma, slug: viejo } },
                update: { experienciaId: id },
                create: { experienciaId: id, idioma, slug: viejo },
              })]
            : []),
          idioma === IDIOMA_ORIGEN
            ? p.experiencia.update({ where: { id }, data: { slug: nuevo } })
            : p.experienciaTraduccion.update({
                where: { experienciaId_idioma: { experienciaId: id, idioma } },
                data: { slug: nuevo },
              }),
        ])
      },
    }
  }

  private tablasProducto(): Tablas {
    const p = this.prisma
    return {
      vigenteOrigen: slug =>
        p.producto.findUnique({ where: { slug }, select: { id: true } }).then(r => r?.id ?? null),
      vigenteTraduccion: slug =>
        p.productoTraduccion
          .findFirst({ where: { slug }, select: { productoId: true } })
          .then(r => r?.productoId ?? null),
      anterior: slug =>
        p.productoSlugAnterior
          .findFirst({ where: { slug }, orderBy: { creadoEn: 'desc' }, select: { productoId: true } })
          .then(r => r?.productoId ?? null),
      actual: async (id, idioma) => {
        if (idioma === IDIOMA_ORIGEN) {
          const prod = await p.producto.findUnique({ where: { id }, select: { slug: true } })
          return prod?.slug ?? null
        }
        const tr = await p.productoTraduccion.findUnique({
          where: { productoId_idioma: { productoId: id, idioma } },
          select: { slug: true },
        })
        return tr ? tr.slug : null
      },
      reemplazar: async (id, idioma, viejo, nuevo) => {
        // Ver tablasExperiencia: mismos tres pasos, misma transacción.
        await p.$transaction([
          p.productoSlugAnterior.deleteMany({ where: { idioma, slug: nuevo } }),
          ...(viejo
            ? [p.productoSlugAnterior.upsert({
                where: { idioma_slug: { idioma, slug: viejo } },
                update: { productoId: id },
                create: { productoId: id, idioma, slug: viejo },
              })]
            : []),
          idioma === IDIOMA_ORIGEN
            ? p.producto.update({ where: { id }, data: { slug: nuevo } })
            : p.productoTraduccion.update({
                where: { productoId_idioma: { productoId: id, idioma } },
                data: { slug: nuevo },
              }),
        ])
      },
    }
  }
}

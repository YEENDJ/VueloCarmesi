import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { toSlug, slugUnico } from '../common/slug'

export type EntidadConSlug = 'experiencia' | 'producto'

/**
 * Lo que diferencia a experiencias de productos para este servicio: en qué
 * tablas vive cada slug. Todo lo demás —qué cuenta como ocupado— es igual para
 * las dos, y por eso vive una sola vez.
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
}

/**
 * El historial de URLs de las fichas.
 *
 * El slug es la URL pública y se trata como tal: nace una vez, al crear la
 * ficha, y no se mueve nunca —ni al renombrar ni por ninguna otra vía—. Una URL
 * que ya posiciona en Google no se toca.
 *
 * Lo que guarda el historial son las URLs viejas de antes de esta regla, cuando
 * renombrar regeneraba el slug (las cargó la migración 20261005000000 desde
 * front/lib/slugs-legados.ts). `findBySlug` las resuelve a la ficha con su slug
 * de hoy y la página responde 308, así que no pierden lo que posicionaban.
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

  private tablas(entidad: EntidadConSlug): Tablas {
    const p = this.prisma
    if (entidad === 'experiencia') {
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
      }
    }
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
    }
  }
}

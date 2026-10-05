import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { TraduccionService } from './traduccion.service'
import { HistorialSlugs, type EntidadConSlug } from '../slugs/historial-slugs.service'
import { capitalizarNombre } from '../common/nombre'
import {
  TEXTO_EXPERIENCIA,
  LISTA_EXPERIENCIA,
  TEXTO_PRODUCTO,
  LISTA_PRODUCTO,
  type MapaHuellas,
  type MapaRevisados,
} from './campos'

/** El único idioma de destino por ahora. Añadir otro es añadirlo a esta lista. */
const IDIOMAS_DESTINO = ['en'] as const

/**
 * Pone al día la fila en inglés de una ficha después de guardarla en español.
 *
 * Se llama desde `create` y `update` de experiencias y productos, y se espera
 * su resultado antes de responder al panel: el admin ve un spinner algo más
 * largo, pero cuando el panel dice «guardado» las dos versiones ya están
 * publicadas y la purga de caché las encuentra a las dos.
 *
 * Nada de lo que pasa acá puede tumbar un guardado. Si DeepL falla, la ficha
 * queda sin inglés y se reintenta en la siguiente edición.
 */
@Injectable()
export class SincronizadorTraduccion {
  private readonly logger = new Logger(SincronizadorTraduccion.name)

  constructor(
    private prisma: PrismaService,
    private traduccion: TraduccionService,
    private slugs: HistorialSlugs,
  ) {}

  /**
   * Envuelve una sincronización para que nunca propague.
   *
   * `traducir()` ya se traga sus propios errores, pero el upsert de Prisma y la
   * búsqueda de slug libre sí pueden lanzar. Sin esta red, una restricción de
   * unicidad rara en la tabla de traducciones haría fallar el guardado de una
   * experiencia —y el admin no podría publicar por un problema de la traducción,
   * que es exactamente lo que este diseño quiere evitar.
   */
  private async aSalvo(etiqueta: string, tarea: () => Promise<void>): Promise<void> {
    try {
      await tarea()
    } catch (err) {
      this.logger.error(`Traducción de ${etiqueta} fallida: ${(err as Error).message}`)
    }
  }

  /**
   * `forzar` retraduce todo aunque el español no haya cambiado.
   *
   * Hace falta cuando cambia el glosario o las instrucciones: la ficha sigue
   * igual, pero la traducción de ayer se hizo con reglas peores. Lo usa el
   * script de relleno, nunca el guardado normal del panel.
   *
   * Lo que está en `revisados` se respeta igual: forzar no es licencia para
   * pisar lo que escribió un humano.
   */
  experiencia(id: string, opciones: { forzar?: boolean } = {}): Promise<void> {
    return this.aSalvo(`experiencia ${id}`, () => this.sincronizarExperiencia(id, opciones))
  }

  producto(id: string, opciones: { forzar?: boolean } = {}): Promise<void> {
    return this.aSalvo(`producto ${id}`, () => this.sincronizarProducto(id, opciones))
  }

  private async sincronizarExperiencia(
    id: string,
    { forzar = false }: { forzar?: boolean } = {},
  ): Promise<void> {
    if (!this.traduccion.disponible) return

    const origen = await this.prisma.experiencia.findUnique({
      where: { id },
      include: { traducciones: true },
    })
    if (!origen) return

    for (const idioma of IDIOMAS_DESTINO) {
      const previa = origen.traducciones.find(t => t.idioma === idioma) ?? null

      const res = await this.traduccion.traducir(
        origen as unknown as Record<string, unknown>,
        TEXTO_EXPERIENCIA,
        LISTA_EXPERIENCIA,
        {
          // Con `forzar` se finge que no hay huella previa: camposACambiar
          // da entonces todos los campos por pendientes y se retraduce la
          // ficha entera con el glosario y las instrucciones de hoy.
          huellaGuardada: forzar ? {} : ((previa?.origenHash ?? {}) as MapaHuellas),
          destino: forzar ? null : (previa as unknown as Record<string, unknown> | null),
          revisados: (previa?.revisados ?? {}) as MapaRevisados,
        },
      )
      if (!res) {
        this.logger.warn(`Experiencia ${origen.slug} guardada sin traducción a ${idioma}`)
        continue
      }

      // Se normaliza la caja tambien en el idioma de destino. DeepL copia la
      // del original —un «AVISTAMIENTO DE AVES» salia al ingles como
      // «BIRDWATCHING»— asi que corregir solo el español dejaria la mitad del
      // sitio gritando. Misma funcion y mismo glosario que en el origen: ARICAO
      // sigue siendo ARICAO en las dos lenguas.
      const nombreNuevo = res.campos.nombre
        ? capitalizarNombre(res.campos.nombre as string)
        : undefined
      const slug = await this.slugEstable('experiencia', id, previa, nombreNuevo)

      const datos = {
        ...res.campos,
        ...(nombreNuevo ? { nombre: nombreNuevo } : {}),
        ...(slug ? { slug } : {}),
        origenHash: res.huellas,
      }

      await this.prisma.experienciaTraduccion.upsert({
        where: { experienciaId_idioma: { experienciaId: id, idioma } },
        // En update se mandan solo los campos que cambiaron: los que ya estaban
        // traducidos y no se tocaron se quedan como están.
        update: datos,
        create: { experienciaId: id, idioma, ...datos },
      })
    }
  }

  private async sincronizarProducto(
    id: string,
    { forzar = false }: { forzar?: boolean } = {},
  ): Promise<void> {
    if (!this.traduccion.disponible) return

    const origen = await this.prisma.producto.findUnique({
      where: { id },
      include: { traducciones: true },
    })
    if (!origen) return

    for (const idioma of IDIOMAS_DESTINO) {
      const previa = origen.traducciones.find(t => t.idioma === idioma) ?? null

      const res = await this.traduccion.traducir(
        origen as unknown as Record<string, unknown>,
        TEXTO_PRODUCTO,
        LISTA_PRODUCTO,
        {
          // Con `forzar` se finge que no hay huella previa: camposACambiar
          // da entonces todos los campos por pendientes y se retraduce la
          // ficha entera con el glosario y las instrucciones de hoy.
          huellaGuardada: forzar ? {} : ((previa?.origenHash ?? {}) as MapaHuellas),
          destino: forzar ? null : (previa as unknown as Record<string, unknown> | null),
          revisados: (previa?.revisados ?? {}) as MapaRevisados,
        },
      )
      if (!res) {
        this.logger.warn(`Producto ${origen.slug} guardado sin traducción a ${idioma}`)
        continue
      }

      // Se normaliza la caja tambien en el idioma de destino. DeepL copia la
      // del original —un «AVISTAMIENTO DE AVES» salia al ingles como
      // «BIRDWATCHING»— asi que corregir solo el español dejaria la mitad del
      // sitio gritando. Misma funcion y mismo glosario que en el origen: ARICAO
      // sigue siendo ARICAO en las dos lenguas.
      const nombreNuevo = res.campos.nombre
        ? capitalizarNombre(res.campos.nombre as string)
        : undefined
      const slug = await this.slugEstable('producto', id, previa, nombreNuevo)

      const datos = {
        ...res.campos,
        ...(nombreNuevo ? { nombre: nombreNuevo } : {}),
        ...(slug ? { slug } : {}),
        origenHash: res.huellas,
      }

      await this.prisma.productoTraduccion.upsert({
        where: { productoId_idioma: { productoId: id, idioma } },
        update: datos,
        create: { productoId: id, idioma, ...datos },
      })
    }
  }

  /**
   * El slug de la traducción: nace con la primera y después no se mueve.
   *
   * Se deriva del nombre ya traducido, no se traduce aparte. Antes se
   * regeneraba cada vez que el nombre inglés cambiaba —y cambia solo, cada vez
   * que alguien corrige el español y DeepL lo vuelve a traducir—, así que la
   * URL inglesa moría sin que nadie la hubiera tocado. Ahora se cambia solo con
   * la acción explícita del panel, que deja la anterior en el historial.
   *
   * Una traducción vieja sin slug lo recibe aquí, del nombre que llegue o del
   * que ya tenía.
   */
  private async slugEstable(
    entidad: EntidadConSlug,
    id: string,
    previa: { slug: string; nombre: string } | null,
    nombreNuevo: string | undefined,
  ): Promise<string | undefined> {
    if (previa?.slug) return previa.slug
    const nombre = nombreNuevo ?? previa?.nombre
    return nombre ? this.slugs.libre(entidad, nombre, id) : undefined
  }
}

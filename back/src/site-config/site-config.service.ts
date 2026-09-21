import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { TraduccionService } from '../traduccion/traduccion.service'
import { IDIOMA_ORIGEN } from '../traduccion/campos'

/**
 * Las claves de SiteConfig que son texto y hay que traducir.
 *
 * El resto —cifras de impacto, URLs de imagen, el WhatsApp, el correo del
 * admin— no es idioma y se sirve igual en los dos.
 */
const CLAVES_TRADUCIBLES = [
  'punto_encuentro',
  'resumen_cancelacion',
  // Las cuatro de la página de grupos que son prosa. Las otras cinco
  // —cupo por jornada, grupo mínimo, tarifa de menores, descuento por volumen y
  // tarifa neta— son cifras o porcentajes y se sirven igual en los dos idiomas.
  'grupos_anticipacion',
  'grupos_aseguradora',
  'grupos_facturacion',
  'grupos_transporte',
] as const

/**
 * Cómo se nombra la versión traducida de una clave.
 *
 * SiteConfig es una tabla clave-valor, así que aquí no hace falta una tabla de
 * traducción como en Experiencia: basta un sufijo. `resumen_cancelacion` es el
 * español y `resumen_cancelacion__en` su versión inglesa. El doble guion bajo
 * evita chocar con una clave que alguien llame `algo_en` por su cuenta.
 */
const claveEn = (clave: string, idioma: string) => `${clave}__${idioma}`

@Injectable()
export class SiteConfigService {
  private readonly logger = new Logger(SiteConfigService.name)

  constructor(
    private prisma: PrismaService,
    private traduccion: TraduccionService,
  ) {}

  /**
   * La configuración en un idioma, con respaldo al español clave por clave.
   *
   * Las claves sufijadas no salen en el resultado: quien consume esto recibe
   * `resumen_cancelacion` con el valor del idioma que pidió, y no tiene que
   * saber que existe el sufijo.
   */
  async getAll(idioma = IDIOMA_ORIGEN): Promise<Record<string, string>> {
    const rows = await this.prisma.siteConfig.findMany()
    const todo = Object.fromEntries(rows.map(r => [r.key, r.value]))

    const salida: Record<string, string> = {}
    for (const [clave, valor] of Object.entries(todo)) {
      // Las sufijadas se resuelven abajo; acá solo pasan las originales.
      if (clave.includes('__')) continue
      salida[clave] = valor
    }

    if (idioma !== IDIOMA_ORIGEN) {
      for (const clave of CLAVES_TRADUCIBLES) {
        const traducido = todo[claveEn(clave, idioma)]?.trim()
        if (traducido) salida[clave] = traducido
      }
    }

    return salida
  }

  /**
   * Guarda y, si cambió un texto, lo traduce antes de responder.
   *
   * Mismo trato que las fichas de experiencia: el admin escribe en español y
   * la versión inglesa aparece sola. Se espera la traducción para que la purga
   * de caché del panel encuentre los dos idiomas ya guardados.
   */
  async patch(data: Record<string, string>): Promise<Record<string, string>> {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )

    await this.traducirCambios(data)
    return this.getAll()
  }

  /**
   * Traduce las claves de texto que vengan en el PATCH.
   *
   * No propaga nunca: si DeepL falla, la configuración queda guardada en
   * español y el respaldo de `getAll` hace que el sitio inglés siga mostrando
   * el texto español en vez de un hueco.
   */
  private async traducirCambios(data: Record<string, string>): Promise<void> {
    if (!this.traduccion.disponible) return

    const pendientes = CLAVES_TRADUCIBLES.filter(c => data[c]?.trim())
    if (pendientes.length === 0) return

    try {
      const origen = Object.fromEntries(pendientes.map(c => [c, data[c]]))
      const res = await this.traduccion.traducir(origen, pendientes, [])
      if (!res) return

      await Promise.all(
        Object.entries(res.campos).map(([clave, valor]) => {
          const key = claveEn(clave, 'en')
          const value = String(valor)
          return this.prisma.siteConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          })
        }),
      )
    } catch (err) {
      this.logger.error(`No se pudo traducir la configuración: ${(err as Error).message}`)
    }
  }
}

import { IDIOMA_ORIGEN } from './campos'

/** Fila de traducción tal como sale de Prisma, con lo que nos interesa de ella. */
type Traduccion = Record<string, unknown> & { idioma: string; slug: string }

/** Lo que los servicios cargan con `include: { traducciones: true }`. */
type ConTraducciones = Record<string, unknown> & {
  slug: string
  traducciones?: Traduccion[]
}

/**
 * El registro listo para servir, ya en un idioma concreto.
 *
 * `slug` es el del idioma pedido —el que va en la URL— y `slugs` trae los dos,
 * que es lo que necesita el selector de idioma: quien está en
 * /en/experiences/cacao-experience y pulsa «Español» tiene que aterrizar en
 * /experiencias/experiencia-cacaotera, no en la misma cadena traducida a medias.
 */
export type Traducido<T> = T & { slug: string; slugs: Record<string, string> }

/**
 * Funde un registro con su traducción, campo por campo.
 *
 * El respaldo es por campo y no por ficha entera: si «nombre» está traducido
 * pero «recomendaciones» no, sale el nombre inglés y las recomendaciones en
 * español, en vez de tirar la traducción completa por un hueco. Eso permite
 * publicar el inglés por partes en lugar de esperar a tenerlo todo.
 *
 * Un campo vacío en la traducción cuenta como ausente. Es lo que hace que un
 * campo opcional sin traducir no deje un hueco en blanco en la ficha inglesa.
 */
export function aplicarTraduccion<T extends ConTraducciones>(
  registro: T,
  idioma: string,
  campos: readonly string[],
): Traducido<Omit<T, 'traducciones'>> {
  const { traducciones = [], ...resto } = registro
  const salida = { ...resto } as Record<string, unknown>

  // Los slugs de todos los idiomas viajan siempre, se pida el que se pida.
  const slugs: Record<string, string> = { [IDIOMA_ORIGEN]: registro.slug }
  for (const t of traducciones) {
    if (t.slug) slugs[t.idioma] = t.slug
  }

  const traduccion = traducciones.find(t => t.idioma === idioma)

  if (traduccion && idioma !== IDIOMA_ORIGEN) {
    for (const campo of campos) {
      const valor = traduccion[campo]
      const vacio = Array.isArray(valor)
        ? valor.length === 0
        : !String(valor ?? '').trim()
      if (!vacio) salida[campo] = valor
    }
  }

  salida.slug = slugs[idioma] ?? registro.slug
  salida.slugs = slugs

  return salida as Traducido<Omit<T, 'traducciones'>>
}

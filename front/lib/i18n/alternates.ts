import type { Metadata } from 'next'
import { getPathname } from './navigation'
import { IDIOMAS, IDIOMA_POR_DEFECTO } from './routing'

/**
 * El bloque `alternates` de una página: su canónica y su equivalente en el
 * otro idioma.
 *
 * Esto es lo que le dice a un buscador «/experiencias y /en/experiences son la
 * misma página en dos lenguas», en vez de dejarle concluir que son contenido
 * duplicado compitiendo entre sí. Sin ello, traducir el sitio puede restar
 * posicionamiento en lugar de sumarlo.
 *
 * Tiene que calcularse POR PÁGINA. Declararlo una vez en el layout sale más
 * barato pero miente: haría que /en/experiences dijera que su versión española
 * es la portada, y un hreflang que apunta a la página equivocada es peor que no
 * tener ninguno — le está afirmando al buscador algo que no es cierto.
 *
 * `href` es la ruta *interna* (la española, la de las carpetas) y `getPathname`
 * la traduce a la de cada idioma, incluido el slug cuando lleva parámetros.
 */
type Href = Parameters<typeof getPathname>[0]['href']

export function alternatesDeIdioma(
  /**
   * La ruta, o una función que la devuelve para cada idioma.
   *
   * La función hace falta en las fichas de detalle, donde el slug **también**
   * cambia de idioma: pasando un href fijo con `slug: exp.slug` se obtiene el
   * slug del idioma actual repetido en las dos ramas, y el alternativo español
   * de /en/experiences/cacao-experience salía como
   * /experiencias/cacao-experience —una URL que redirige, no la canónica—.
   * Declararle eso a un buscador es peor que no declarar nada.
   */
  href: Href | ((idioma: string) => Href),
  locale: string,
): NonNullable<Metadata['alternates']> {
  const hrefDe = (idioma: string): Href =>
    typeof href === 'function' ? href(idioma) : href

  const languages: Record<string, string> = {}
  for (const idioma of IDIOMAS) {
    languages[idioma] = getPathname({ href: hrefDe(idioma), locale: idioma })
  }

  return {
    canonical: getPathname({ href: hrefDe(locale), locale }),
    languages: {
      ...languages,
      // Para quien no encaje en ninguno de los dos idiomas declarados. Se
      // manda al español, que es el original y el catálogo completo.
      'x-default': languages[IDIOMA_POR_DEFECTO],
    },
  }
}

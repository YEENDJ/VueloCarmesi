import { getPathname } from './navigation'
import type { Idioma } from './routing'

type Href = Parameters<typeof getPathname>[0]['href']

/**
 * Las rutas cuyo slug cambia con el idioma y que publican sus slugs con
 * <PublicarSlugs>. /reservar/[slug] no está: no lo publica, va fuera del índice
 * y sigue funcionando con el slug actual.
 */
const FICHAS = new Set(['/experiencias/[slug]', '/tienda/[slug]'])

/**
 * La URL final de esta misma página en otro idioma.
 *
 * Devuelve null en una ficha cuyos slugs aún no se conocen. El selector vive en
 * el layout y la página los publica al montarse, así que en el HTML del servidor
 * solo se tendría el slug del idioma actual: /en/experiences/experiencia-cacaotera,
 * una URL que redirige. Es mejor no enlazar nada durante ese instante.
 *
 * Con la ruta ya resuelta no basta para next-intl: la coteja contra la plantilla
 * de routing.ts y revienta con «Insufficient params provided for localized
 * pathname». Por eso se le da la plantilla y los parámetros por separado, para
 * cualquier parámetro y no solo `slug`.
 */
export function destinoIdioma({
  pathname,
  params,
  slugs,
  idioma,
}: {
  /** La ruta interna, tal como la devuelve `usePathname` de next-intl. */
  pathname: string
  params: Record<string, string | string[] | undefined> | null
  /** null: la página todavía no ha publicado los suyos, o no publica. */
  slugs: Record<string, string> | null
  idioma: Idioma
}): string | null {
  const dinamicos = Object.entries(params ?? {}).filter(
    (e): e is [string, string] => e[0] !== 'locale' && typeof e[1] === 'string',
  )
  if (dinamicos.length === 0) {
    return getPathname({ href: pathname as Href, locale: idioma })
  }

  // Segmento a segmento, para no tocar un trozo de otro tramo que por
  // casualidad contenga el mismo texto.
  const plantilla = pathname
    .split('/')
    .map(tramo => {
      const nombre = dinamicos.find(([, valor]) => valor === tramo)?.[0]
      return nombre ? `[${nombre}]` : tramo
    })
    .join('/')

  if (FICHAS.has(plantilla) && slugs === null) return null

  const valores = Object.fromEntries(dinamicos)
  // Una ficha sin slug traducido se sirve con el mismo en los dos idiomas.
  if (valores.slug) valores.slug = slugs?.[idioma] ?? valores.slug

  return getPathname({
    href: { pathname: plantilla, params: valores } as Href,
    locale: idioma,
  })
}

/**
 * Deja escrito en la cookie el idioma al que se va.
 *
 * El español no lleva prefijo, y sin prefijo el middleware decide por la cookie:
 * con NEXT_LOCALE=en, /aviturismo devuelve al visitante a /en/birding. Por eso
 * next-intl fuerza /es/aviturismo en su Link, a costa de un 307 en cada enlace.
 * Este selector enlaza directo a la URL final y actualiza la cookie antes de ir.
 *
 * El nombre y los atributos son los que next-intl usa por defecto.
 */
export function recordarIdioma(idioma: Idioma) {
  document.cookie = `NEXT_LOCALE=${idioma}; path=/; SameSite=lax`
}

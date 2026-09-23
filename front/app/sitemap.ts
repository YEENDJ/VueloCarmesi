import type { MetadataRoute } from 'next'
import { getExperiencias } from '@/lib/api/experiencias'
import { getProductos } from '@/lib/api/productos'
import { getPathname } from '@/lib/i18n/navigation'
import { IDIOMAS, IDIOMA_POR_DEFECTO, routing } from '@/lib/i18n/routing'
import { SITIO } from '@/lib/sitio'

/**
 * El /sitemap.xml del sitio, que hasta ahora devolvía 404 — justo la URL que
 * robots.txt viene declarando.
 *
 * Hace falta por las fichas: tienda y experiencias tienen un slug distinto por
 * idioma y el inglés solo se alcanza siguiendo enlaces desde dentro. Sin este
 * archivo, un catálogo entero depende de que el rastreador recorra el sitio
 * hasta el fondo, y Search Console no puede dar cobertura por URL de nada.
 *
 * Cada página aparece DOS veces, una por idioma, y las dos llevan el mismo
 * bloque `alternates.languages` con las dos URLs y `x-default`. Es lo que pide
 * Google: cada URL declarada tiene que listar a todas sus hermanas, incluida
 * ella misma. Declarar solo la española dejaría el inglés sin entrada propia y
 * sin informe de cobertura.
 */

// El techo de caducidad del segmento.
//
// Manda el menor de dos números, y hoy gana el otro: los fetch de catálogo
// traen su propio revalidate de 60 s, así que `next build` reporta 1m para
// esta ruta. Este 3600 es la red por debajo —el caso en que no llegue a
// registrarse ningún fetch—, porque un sitemap sin caducidad se queda
// congelado con lo que tuviera el día que se generó, y lo que tiene uno
// generado durante una caída del backend son las páginas fijas y ni una ficha.
export const revalidate = 3600

type Ruta = keyof typeof routing.pathnames
/** Las rutas sin parámetros: las de plantilla se resuelven con datos, abajo. */
type RutaFija = Exclude<Ruta, `${string}[${string}]${string}`>

/**
 * Lo que NO entra, aunque esté en `routing.pathnames`.
 *
 * Es el embudo de compra, el mismo que robots.txt prohíbe rastrear. Ninguna de
 * estas URLs resuelve una búsqueda —el carrito de un rastreador siempre está
 * vacío— y las dos confirmaciones solo existen después de pagar o de reservar.
 * `/reservar/[slug]` no hace falta nombrarla: lleva parámetro y queda fuera
 * por tipo.
 *
 * Si alguien añade acá una ruta que sí debería indexarse, el test de al lado
 * no lo caza; ese es el precio de la lista negra. A cambio, una página pública
 * NUEVA entra sola en el sitemap con solo declararla en routing.ts, que es el
 * paso que de todos modos no se puede saltar. Al revés —lista blanca— la
 * página nueva se quedaría fuera y nadie se enteraría durante meses.
 */
const FUERA: readonly RutaFija[] = [
  '/carrito',
  '/checkout',
  '/checkout/confirmacion',
  '/reservar/confirmacion',
]

const esFija = (ruta: Ruta): ruta is RutaFija => !ruta.includes('[')

const RUTAS_FIJAS: RutaFija[] = (Object.keys(routing.pathnames) as Ruta[])
  .filter(esFija)
  .filter(ruta => !FUERA.includes(ruta))

type Href = Parameters<typeof getPathname>[0]['href']

/**
 * La URL completa de una ruta interna en un idioma.
 *
 * Pasa por `new URL` y no por concatenación para que un slug con espacios o
 * acentos salga percent-encoded: en `<loc>` una URL sin codificar es un
 * elemento inválido y algunos validadores tiran el sitemap entero. Los slugs de
 * hoy están normalizados, pero los hubo con espacios (ver lib/slugs-legados.ts)
 * y el panel puede volver a crearlos.
 *
 * La portada sale sin barra final, como `SITIO`. `new URL('/', …)` la añade,
 * pero Next escribe la canónica y el hreflang de la raíz con el origen pelado
 * (resolveAbsoluteUrlWithPathname en next/dist/lib/metadata): si el sitemap
 * pusiera la barra, la URL de más autoridad del sitio llegaría a Google con
 * dos grafías y sería él quien eligiera cuál vale.
 */
const absoluta = (href: Href, idioma: string): string => {
  const url = new URL(getPathname({ href, locale: idioma }), SITIO)
  return url.pathname === '/' && !url.search ? url.origin : url.toString()
}

/**
 * Las dos entradas de una página —española e inglesa— con su bloque hreflang.
 *
 * `href` puede ser una función porque en las fichas el slug TAMBIÉN cambia de
 * idioma. Misma firma y mismo criterio que `alternatesDeIdioma()`, que es quien
 * escribe la canónica de cada página: si las dos no coinciden carácter por
 * carácter, el sitemap estaría proponiendo una URL que la propia página declara
 * no canónica, y eso es peor señal que no tener sitemap.
 *
 * No se emite `lastModified`: la base solo guarda `createdAt`, así que la única
 * fecha disponible es la de creación y una ficha editada ayer se anunciaría
 * como de hace dos años. Google ignora el `lastmod` en cuanto lo pilla
 * mintiendo, y con él se lleva por delante el de todo el sitemap. `priority` y
 * `changefreq` se omiten por lo mismo: Google dice explícitamente que no los
 * usa.
 */
function entradas(href: Href | ((idioma: string) => Href)): MetadataRoute.Sitemap {
  const hrefDe = (idioma: string): Href =>
    typeof href === 'function' ? href(idioma) : href

  const languages: Record<string, string> = {}
  for (const idioma of IDIOMAS) {
    languages[idioma] = absoluta(hrefDe(idioma), idioma)
  }

  return IDIOMAS.map(idioma => ({
    url: languages[idioma],
    alternates: {
      // Para quien no encaje en ninguno de los dos: al español, que es el
      // original y el catálogo completo.
      languages: { ...languages, 'x-default': languages[IDIOMA_POR_DEFECTO] },
    },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // En español a propósito, y una sola llamada por catálogo: la respuesta trae
  // `slugs` con los DOS idiomas se pida el que se pida (back/src/traduccion/
  // aplicar-traduccion.ts), así que pedir el inglés aparte no añadiría nada.
  //
  // El `.catch` es cinturón sobre tirantes —hoy las dos funciones ya devuelven
  // [] cuando el backend no responde— pero sus gemelas `...BySlug` sí propagan,
  // y confundirlas costaría un 500 en /sitemap.xml. Un sitemap corto es un mal
  // día; un sitemap que no responde es una URL rota en robots.txt.
  const [experiencias, productos] = await Promise.all([
    getExperiencias().catch(() => []),
    getProductos().catch(() => []),
  ])

  return [
    ...RUTAS_FIJAS.flatMap(ruta => entradas(ruta)),

    // El slug de cada idioma sale de `slugs`. Cuando una ficha aún no está
    // traducida no hay entrada inglesa y se repite la española: /en/shop/<slug
    // español> resuelve —el backend busca por el slug original en los dos
    // idiomas— y es exactamente lo que esa página declara como canónica.
    ...experiencias.flatMap(exp => entradas(idioma => ({
      pathname: '/experiencias/[slug]',
      params: { slug: exp.slugs?.[idioma] ?? exp.slug },
    }))),

    ...productos.flatMap(prod => entradas(idioma => ({
      pathname: '/tienda/[slug]',
      params: { slug: prod.slugs?.[idioma] ?? prod.slug },
    }))),
  ]
}

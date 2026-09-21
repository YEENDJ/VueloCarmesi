import { defineRouting } from 'next-intl/routing'

/** Los dos idiomas del sitio público. El panel admin queda fuera: lo usa una sola persona. */
export const IDIOMAS = ['es', 'en'] as const
export type Idioma = (typeof IDIOMAS)[number]

export const IDIOMA_POR_DEFECTO: Idioma = 'es'

/** Para el selector de idioma y para el hreflang. */
export const ETIQUETA_IDIOMA: Record<Idioma, string> = {
  es: 'Español',
  en: 'English',
}

/**
 * Enrutado de los dos idiomas.
 *
 * `localePrefix: 'as-needed'` deja el español donde ya está —/experiencias, y
 * no /es/experiencias—, así que nada de lo indexado se mueve ni necesita 301.
 * Eso importa sobre todo por /aviturismo, que es la única página que hoy tiene
 * trabajo de posicionamiento encima.
 *
 * Las claves de `pathnames` son las rutas *internas*: coinciden con las
 * carpetas de app/[locale]/, que están en español porque así nació el proyecto.
 * El valor es cómo se ve esa misma ruta en cada idioma de cara al visitante.
 *
 * Las rutas inglesas no son una traducción literal sino la palabra que se
 * busca: /birding y no /birdwatching-tourism, /book y no /reserve. La URL es
 * una señal de posicionamiento y el término del gremio gana al término del
 * diccionario.
 */
export const routing = defineRouting({
  locales: IDIOMAS,
  defaultLocale: IDIOMA_POR_DEFECTO,
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',

    // Landing
    '/aviturismo': { es: '/aviturismo', en: '/birding' },
    '/sobre-nosotros': { es: '/sobre-nosotros', en: '/about' },
    '/contacto': { es: '/contacto', en: '/contact' },
    // «group-visits» y no «groups»: misma regla que /birding. «Groups» es solo
    // un sustantivo; lo que escribe un colegio internacional o una agencia
    // receptiva buscando proveedor es «group visits».
    '/grupos': { es: '/grupos', en: '/group-visits' },

    // Reservas. El [slug] lo rellena la base de datos: next-intl traduce el
    // segmento de ruta, no el slug del contenido. El slug inglés sale de la
    // tabla de traducción y por eso no aparece acá.
    '/experiencias': { es: '/experiencias', en: '/experiences' },
    '/experiencias/[slug]': { es: '/experiencias/[slug]', en: '/experiences/[slug]' },
    '/reservar/[slug]': { es: '/reservar/[slug]', en: '/book/[slug]' },
    '/reservar/confirmacion': { es: '/reservar/confirmacion', en: '/book/confirmation' },

    // Tienda
    '/tienda': { es: '/tienda', en: '/shop' },
    '/tienda/[slug]': { es: '/tienda/[slug]', en: '/shop/[slug]' },
    '/carrito': { es: '/carrito', en: '/cart' },
    '/checkout': { es: '/checkout', en: '/checkout' },
    '/checkout/confirmacion': { es: '/checkout/confirmacion', en: '/checkout/confirmation' },

    // Políticas
    '/politicas': { es: '/politicas', en: '/policies' },
    '/politicas/cancelacion': { es: '/politicas/cancelacion', en: '/policies/cancellation' },
    '/politicas/proteccion-infancia': {
      es: '/politicas/proteccion-infancia',
      en: '/policies/child-protection',
    },
    // «personal-data» y no «habeas-data»: el segundo es el término colombiano y
    // no lo busca nadie que lea la versión inglesa.
    '/politicas/datos-personales': {
      es: '/politicas/datos-personales',
      en: '/policies/personal-data',
    },
    '/politicas/terminos-tienda': {
      es: '/politicas/terminos-tienda',
      en: '/policies/shop-terms',
    },
    '/politicas/sostenibilidad': {
      es: '/politicas/sostenibilidad',
      en: '/policies/sustainability',
    },
  },
})

/**
 * Qué rutas pasan por el proxy de idioma.
 *
 * Vive aparte de proxy.ts para poder probarlo: importar el proxy en un test
 * arrastra `next-intl/middleware` y todo el entorno de servidor de Next, y este
 * patrón es justo la pieza que hay que verificar.
 *
 * Se excluye todo lo que no es el sitio público. El panel vive en español y no
 * tiene segmento [locale]: si el proxy lo tocara, intentaría reescribir /admin
 * a /es/admin y el panel dejaría de existir. `api` es servidor puro, y
 * `portafolio` es el HTML estático que sirve el rewrite de next.config — un
 * prefijo de idioma ahí rompería el enlace que ya se comparte.
 *
 * El último tramo deja fuera cualquier cosa con extensión: las fotos de
 * public/, las fuentes y el favicon no necesitan negociación de idioma.
 *
 * OJO CON LA DOBLE BARRA INVERTIDA. Esto es una cadena de JavaScript, no una
 * expresión regular literal. Escrito `\.` el parser de cadenas se come la
 * barra —`'\.'` es `'.'`— y el patrón pasa a significar «dos caracteres
 * cualesquiera», que excluye TODAS las rutas menos la raíz. Pasó, y no dio ni
 * un error: un matcher que no casa no falla, simplemente no hace nada, así que
 * el sitio entero devolvía 404 con la consola limpia. De ahí el test de al lado.
 */
export const MATCHER_IDIOMA = '/((?!api|admin|portafolio|_next|_vercel|.*\\..*).*)'

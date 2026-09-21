import type { MetadataRoute } from 'next'
import { SITIO } from '@/lib/sitio'

/**
 * El /robots.txt del sitio, que hasta ahora devolvía 404.
 *
 * Su trabajo principal no es prohibir sino declarar el sitemap: sin esa línea,
 * las fichas de producto y de experiencia —slug dinámico, dos idiomas— solo se
 * descubren siguiendo enlaces.
 *
 * Lo que queda fuera es el panel y el embudo de compra. Ninguna de esas URLs
 * resuelve una búsqueda —el carrito de un rastreador siempre está vacío— y la
 * confirmación además pinta datos del pedido.
 *
 * Las rutas van en los dos idiomas a mano porque `localePrefix: 'as-needed'`
 * deja el español sin prefijo y el inglés con /en, y robots.txt no entiende de
 * rutas internas: solo compara el texto de la URL servida. Si se traduce un
 * pathname en lib/i18n/routing.ts, hay que reflejarlo aquí.
 *
 * OJO: `disallow` impide el rastreo, no la indexación. Una URL enlazada desde
 * fuera puede entrar al índice igual, sin descripción. Por eso /admin lleva
 * además `robots: { index: false }` en su layout, y por eso conviene que
 * carrito y checkout lo lleven también.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/carrito',
        '/checkout',
        '/reservar/',
        '/en/cart',
        '/en/checkout',
        '/en/book/',
      ],
    },
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  }
}

/**
 * El origen público del sitio.
 *
 * Vivía suelto dentro de la página de aviturismo, que era la única que hacía
 * metadatos. Ahora lo necesitan el layout de idioma, el sitemap y el hreflang
 * de cada página, así que sale a un solo sitio: una URL equivocada en producción
 * se arregla en un punto y no en siete.
 */
export const SITIO = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://vuelocarmesi.com'

/**
 * El origen público del sitio.
 *
 * Vivía suelto dentro de la página de aviturismo, que era la única que hacía
 * metadatos. Ahora lo necesitan el layout de idioma, el sitemap y el hreflang
 * de cada página, así que sale a un solo sitio: una URL equivocada en producción
 * se arregla en un punto y no en siete.
 *
 * El respaldo lleva `www` porque es el host que responde 200: el apex hace 301
 * hacia él. Un canonical sin `www` declara como versión buena una URL que
 * redirige, y con eso contamina también el hreflang y el og:image de las
 * páginas que sí tienen metadatos. El respaldo es la última red: lo correcto
 * es que NEXT_PUBLIC_SITE_URL esté puesta en el despliegue.
 *
 * Con `||` y no con `??`: en .env.example la variable va declarada pero vacía,
 * y una cadena vacía no es nullish. Con `??` pasaría el '' a new URL(), que
 * lanza, y el build se caería con un error que no señala a este archivo.
 *
 * La barra final se recorta porque todo el que lo usa concatena una ruta que
 * ya empieza por `/`: sin esto saldría `https://…//aviturismo`.
 */
export const SITIO =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') || 'https://www.vuelocarmesi.com'

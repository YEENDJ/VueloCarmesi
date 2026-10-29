/**
 * La tarjeta para compartir del sitio: logo, lema, cacaotal y colibrí, en el
 * 1200×630 de WhatsApp y Facebook, una por idioma.
 *
 * La usan la portada, el layout de idioma —para las páginas que no declaran
 * imagen propia— y las fichas cuya experiencia o producto no tiene portada:
 * esas reemplazan el `openGraph` del layout entero y sin esto se compartían
 * sin ninguna imagen.
 *
 * Los archivos salen de scripts/generar-og.py. Si se regeneran, cambia aquí el
 * nombre: WhatsApp y Facebook guardan la vista previa por URL.
 */
export function tarjetaOg(locale: string, alt: string) {
  return {
    url: `/images/og/portada-${locale === 'en' ? 'en' : 'es'}.jpg`,
    width: 1200,
    height: 630,
    alt,
  }
}

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//

/**
 * La imagen para compartir de una ficha a partir de su portada: la portada
 * entera, sin recortar ni agrandar, sobre un fondo 1200×630 hecho con ella
 * misma desenfocada y algo oscurecida.
 *
 * Entera porque las portadas no son todas fotos: la de la Ruta café y cacao es
 * un afiche cuadrado con el título arriba, y un recorte a 1200×630 se lo
 * comía. Sin agrandar porque hay portadas de producto de 366 px que estiradas
 * a 1200 salían borrosas. El fondo es una capa (`l_` + `fl_layer_apply`) y no
 * `b_blurred`, que esta cuenta de Cloudinary rechaza.
 *
 * Solo para la tarjeta de WhatsApp y Facebook: en la página se sigue sirviendo
 * el original. El original de una experiencia pasa de los ~300 KB a partir de
 * los cuales WhatsApp deja de mostrar la vista previa y no declara medidas, así
 * que Facebook la primera vez la pinta sin imagen. Esta va en JPG —el formato
 * que leen todas— y con sus medidas.
 *
 * Una portada que no es de Cloudinary (una foto de `public/`) vuelve tal cual y
 * sin medidas. Una que ya trae transformaciones —un recorte del panel— se
 * rellena con `b_auto` en vez de la capa, porque la capa partiría del original
 * sin ese recorte.
 */
export function portadaOg(url: string, alt: string) {
  if (!CLOUDINARY.test(url)) return { url, alt }

  const [base, resto] = url.split('/upload/')
  const segmentos = resto.split('/')
  const version = segmentos.findIndex(s => /^v\d+$/.test(s))
  const previas = version >= 0 ? version : segmentos.findIndex(s => !/^[a-z]{1,3}_/.test(s))
  // La extensión también decide el formato en Cloudinary: .jpg para que no
  // contradiga al f_jpg si el original era PNG o WebP.
  const id = segmentos.slice(version >= 0 ? version + 1 : previas).join('/').replace(/\.[a-zA-Z0-9]+$/, '')
  const final = `q_auto:good,f_jpg/${segmentos.slice(previas).join('/').replace(/\.[a-zA-Z0-9]+$/, '.jpg')}`

  const transformacion = previas > 0
    ? `${segmentos.slice(0, previas).join('/')}/c_lpad,w_1200,h_630,b_auto,${final}`
    : `c_fill,w_1200,h_630/e_blur:1200/e_brightness:-25/l_${id.replace(/\//g, ':')},c_limit,w_1200,h_630/fl_layer_apply,${final}`

  return { url: `${base}/upload/${transformacion}`, width: 1200, height: 630, alt }
}

/**
 * Fotos servidas desde Cloudinary, con transformación y `srcset`.
 *
 * Las cinco fotos de la portada —el hero, las tres tarjetas destacadas y la de
 * «sobre nosotros»— no viven en `public/`: son URLs que el panel guarda en la
 * base y que el servidor devuelve tal cual. Sin tocarlas, el navegador recibe
 * el original subido por el negocio: el hero medía 519 977 B de JPEG, el mismo
 * archivo para un portátil y para un teléfono.
 *
 * `next/image` no es el camino aquí. Necesitaría `remotePatterns` y pondría el
 * optimizador de Vercel por delante de un CDN de imágenes, que es exactamente
 * lo que Cloudinary ya es: dos saltos, cuota consumida y el original completo
 * descargado igual en el primer acceso. Insertando la transformación en la URL
 * se obtiene lo mismo —AVIF/WebP según el cliente, un ancho por punto de
 * ruptura— en el sitio donde la imagen ya está.
 *
 * Medido sobre el hero (`b6kvdkcivynxozbxz3oc.jpg`, 508 KB):
 *   w_1600 → 302 KB · w_1280 → 180 KB (webp) · w_640 → 57 KB · w_480 → 36 KB
 */

/** Anchos del `srcset`. Saltos de ~1,3×: más finos no cambian el archivo que elige el navegador. */
const ANCHOS = [320, 480, 640, 768, 960, 1200, 1600, 2000]

/**
 * `f_auto` elige AVIF, WebP o el JPEG original según lo que acepte el cliente
 * y cuál pese menos. `q_auto` ajusta la compresión al contenido. `c_limit`
 * reduce pero nunca amplía: pedir un ancho mayor que el del archivo devuelve
 * el archivo, no una versión interpolada y más pesada.
 */
const TRANSFORMACION = 'f_auto,q_auto,c_limit'

/** Una URL de entrega de Cloudinary, que es la única que sabemos transformar. */
export function esCloudinary(src: string | undefined | null): src is string {
  return !!src && src.startsWith('https://res.cloudinary.com/') && src.includes('/upload/')
}

/**
 * La misma foto limitada a `ancho` píxeles.
 *
 * La transformación se encadena **al final**, justo antes de la versión, y no
 * pegada a `/upload/`. Importa cuando la URL ya trae un recorte hecho desde el
 * panel: encadenada al final, el recorte se aplica primero y nosotros
 * reducimos su resultado. Al revés, reduciríamos el original y el recorte
 * posterior tendría que ampliar lo que le llega.
 */
function conAncho(src: string, ancho: number): string {
  const corte = src.indexOf('/upload/') + '/upload/'.length
  const partes = src.slice(corte).split('/')

  // La versión (`v1787706935`) marca el final de las transformaciones y el
  // principio del identificador del archivo. Cloudinary siempre la incluye en
  // lo que devuelve al subir; si aun así faltara, insertamos al principio
  // —correcto salvo que esa URL ya trajera transformaciones propias—.
  const version = partes.findIndex((parte) => /^v\d+$/.test(parte))
  partes.splice(version === -1 ? 0 : version, 0, `${TRANSFORMACION},w_${ancho}`)

  return src.slice(0, corte) + partes.join('/')
}

/**
 * Los atributos `src` y `srcSet` de una foto que se pinta, como mucho, a
 * `anchoMaximo` píxeles CSS.
 *
 * El tope del `srcset` es el doble: es el ancho que pide una pantalla 2×, y
 * por encima el archivo pesa más sin que se vea mejor. El `src` se queda en 1×
 * porque solo lo usa un navegador sin `srcset`, y entonces es mejor que reciba
 * el archivo ligero.
 *
 * Una URL que no sea de Cloudinary vuelve intacta y sin `srcSet`: un
 * `placeholder` o una ruta de `public/` no tienen por qué romperse.
 */
export function fotoCloudinary(
  src: string,
  anchoMaximo: number,
): { src: string; srcSet?: string } {
  if (!esCloudinary(src)) return { src }

  const tope = anchoMaximo * 2
  const anchos = [...ANCHOS.filter((ancho) => ancho < tope), tope]

  return {
    src: conAncho(src, anchoMaximo),
    srcSet: anchos.map((ancho) => `${conAncho(src, ancho)} ${ancho}w`).join(', '),
  }
}

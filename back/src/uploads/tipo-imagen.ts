/**
 * Qué es de verdad el archivo que subieron, mirando sus primeros bytes.
 *
 * El `mimetype` de multer no es una comprobación: es lo que el navegador dice
 * que mandó, y el navegador lo deduce de la extensión o de lo que le pasó el
 * sistema operativo. En producción llega mal de tres formas, todas con la foto
 * perfectamente sana:
 *
 * - `image/jpg` en vez de `image/jpeg`, que declaran algunos Android y varias
 *   apps de mensajería al reenviar una foto.
 * - `application/octet-stream` o cadena vacía, cuando el archivo viene de
 *   Descargas o de WhatsApp y el sistema no tiene mapeada la extensión.
 * - `image/heic`, que es una foto de iPhone de verdad: quien la sube la ve
 *   normal en su galería y no tiene forma de saber que no es un JPG.
 *
 * Las firmas están fijadas por cada formato y no dependen de quién suba el
 * archivo, así que aquí es donde se decide. El `mimetype` queda como pista para
 * el registro, nunca como veredicto.
 */
export type FormatoImagen = 'jpeg' | 'png' | 'webp' | 'heic'

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Marcas `ftyp` de la familia HEIF que usan las cámaras de iPhone. */
const MARCAS_HEIC = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1']

/**
 * El formato real del archivo, o `null` si no es ninguna imagen que conozcamos.
 * Solo mira la cabecera, así que da igual el tamaño del archivo.
 */
export function formatoDeBuffer(buf: Buffer): FormatoImagen | null {
  // JPEG: SOI (FF D8) seguido del primer marcador. Cubre JFIF, Exif y los que
  // escriben las cámaras, que se diferencian recién en el cuarto byte.
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpeg'
  }

  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG)) {
    return 'png'
  }

  // WebP es un contenedor RIFF: 'RIFF', cuatro bytes de tamaño, y luego 'WEBP'.
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }

  // HEIC/HEIF: caja 'ftyp' en el byte 4 y la marca de formato justo detrás.
  if (
    buf.length >= 12 &&
    buf.subarray(4, 8).toString('ascii') === 'ftyp' &&
    MARCAS_HEIC.includes(buf.subarray(8, 12).toString('ascii').toLowerCase())
  ) {
    return 'heic'
  }

  return null
}

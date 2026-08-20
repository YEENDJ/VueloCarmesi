/**
 * La portada de una ficha es siempre la primera foto de su galería.
 *
 * La columna `imagen` sigue existiendo porque la consumen las tarjetas, el
 * carrito, los ítems de pedido y los correos. En vez de dejar que el panel la
 * edite por separado —lo que permitiría una portada que no está en la galería,
 * o una galería vacía con portada puesta— se deriva aquí, en el único punto por
 * el que pasan crear y editar. Así las dos columnas no se pueden separar.
 */
export function portadaDe(imagenes?: string[]): string {
  return imagenes?.[0] ?? ''
}

/**
 * Convierte una URL de Cloudinary en su `public_id`, que es lo que pide su API
 * para borrar. No se guarda en la base porque se puede recuperar de la URL:
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/v1782953553/vuelo-carmesi/abc.jpg
 *                                                              └──── public_id ────┘
 *
 * Devuelve null si la URL no es de Cloudinary —por ejemplo una foto de la
 * biblioteca local— para que el borrado la ignore en vez de fallar.
 */
export function publicIdDeCloudinary(url: string): string | null {
  if (!url.includes('res.cloudinary.com')) return null

  const despuesDeUpload = url.split('/upload/')[1]
  if (!despuesDeUpload) return null

  // Entre /upload/ y el public_id pueden aparecer transformaciones (w_500,h_300)
  // y una version (v1782953553). Ninguna forma parte del identificador, así que
  // se descartan por delante hasta dar con el primer segmento real.
  const segmentos = despuesDeUpload.split('/')
  while (segmentos.length > 1 && /^(v\d+|[a-z]{1,3}_.+)$/.test(segmentos[0])) {
    segmentos.shift()
  }

  const sinExtension = segmentos.join('/').replace(/\.[a-zA-Z0-9]+$/, '')
  return sinExtension || null
}

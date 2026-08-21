/**
 * URLs viejas que ya no existen, y adónde van ahora.
 *
 * Los slugs originales se guardaron sin normalizar —mayúsculas, espacios, uno
 * con espacio final— y encima quedaron congelados cuando las fichas se
 * renombraron: `chocolates` era en realidad el Chocolate ARICAO 100% x 125 g.
 * `prisma/migrar-galeria-y-slugs.ts` los corrigió y este mapa es su salida.
 *
 * La redirección se resuelve en la página, comparando en JavaScript, y no con
 * `redirects()` de next.config: estas claves llevan espacios y mayúsculas, que
 * en un patrón de ruta habría que escapar y codificar a mano, con una forma
 * distinta según cómo llegue la petición. Comparar la cadena ya decodificada no
 * tiene ese problema.
 *
 * Si vuelves a renombrar una ficha desde el panel, el backend genera el slug
 * nuevo y la URL anterior deja de existir: agrega la pareja acá si esa URL
 * llegó a compartirse.
 */

export const SLUGS_EXPERIENCIAS_LEGADOS: Record<string, string> = {
  'EXPERIENCIA BIENESTAR': 'mascarilla-de-cacao-refrigerio',
  'VIVE UNA EXPERIENCIA INMERCIVA EN EL MUNDO DEL CACAO ': 'experiencia-cacaotera',
  'DESPIERTA ENTRE AVES Y CACAO': 'experiencia-aves-cacao',
  'AVITURISMO': 'avistamiento-de-aves',
}

export const SLUGS_PRODUCTOS_LEGADOS: Record<string, string> = {
  'chocolates': 'chocolate-aricao-100-x-125-gramos',
  'vino-de-cafe-x-375ml': 'vino-de-cafe-x-375-ml',
  'vino-de-mucilago-de-cacao-x-375ml': 'vino-de-mucilago-de-cacao-x-375-ml',
  'chocolatina': 'chocolatina-aricao-100-85-y-50-x-60-gramos',
  'chocolatina CARAO': 'chocolatina-carao-70-y-80-x-50-gramos',
  'Mascarilla de cacao': 'mascarilla-de-cacao',
  'Chocolate ARICAO ': 'chocolate-aricao-100-x-500-gramos',
  'chocolate ARICAO': 'chocolate-aricao-100-x-250-gramos',
  'mermelada de mucilago': 'mermelada-de-mucilago-de-cacao-x-150-y-200-gramos',
  'grageas-x-70-gramos': 'grageas-mujari-x-70-gramos',
  'destilado-de-cacao-paradiso-x-300ml': 'destilado-de-cacao-paradiso-x-300-ml',
}

/**
 * Busca el destino de un slug viejo. El parámetro llega tal cual viene en la
 * ruta, es decir percent-encoded, así que se prueba también decodificado: un
 * enlace a `/tienda/Mascarilla%20de%20cacao` tiene que encontrar su entrada.
 */
export function destinoLegado(
  mapa: Record<string, string>,
  slug: string,
): string | null {
  if (mapa[slug]) return mapa[slug]
  try {
    const decodificado = decodeURIComponent(slug)
    return mapa[decodificado] ?? null
  } catch {
    // Un percent-encoding inválido no es un slug legado, es una URL rota.
    return null
  }
}

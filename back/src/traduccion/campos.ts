import { createHash } from 'crypto'

/**
 * El idioma en que se escribe el contenido. No tiene fila de traducción: es el
 * original contra el que se comparan los demás y el respaldo de todos ellos.
 */
export const IDIOMA_ORIGEN = 'es'

/** Los idiomas que el sitio publica. Debe coincidir con front/lib/i18n/routing.ts. */
export const IDIOMAS_PUBLICOS = ['es', 'en'] as const

/**
 * Normaliza el `?idioma=` de la URL.
 *
 * El parámetro llega de fuera y es texto libre: cualquier cosa que no sea un
 * idioma publicado cae al español en vez de propagarse hasta una consulta con
 * un idioma inventado, que devolvería la ficha sin traducir pero habiendo hecho
 * el trabajo de buscarla.
 */
export function idiomaValido(valor?: string): string {
  const limpio = valor?.trim().toLowerCase()
  return (IDIOMAS_PUBLICOS as readonly string[]).includes(limpio ?? '')
    ? (limpio as string)
    : IDIOMA_ORIGEN
}

/**
 * Qué campos de cada ficha son texto traducible.
 *
 * Lo que no está en estas listas no se traduce porque no es idioma: precio y
 * capacidad son números, `imagenes` son URLs, y `destacada` es un booleano. El
 * slug tampoco aparece: no se traduce, se deriva del nombre ya traducido.
 */
export const TEXTO_EXPERIENCIA = [
  'nombre',
  'descripcion',
  'descripcionLarga',
  'duracion',
  'horarios',
  'recomendaciones',
  'puntoEncuentro',
] as const

/** Campos `String[]`: cada viñeta se traduce por separado y vuelve a su sitio. */
export const LISTA_EXPERIENCIA = ['incluye', 'queTraer', 'noIncluye'] as const

export const TEXTO_PRODUCTO = [
  'nombre',
  'descripcion',
  'descripcionLarga',
  'categoria',
] as const

export const LISTA_PRODUCTO = [] as const

export type CampoTraducible = string
/** Lo que se guarda en `origenHash`: una huella corta por campo. */
export type MapaHuellas = Record<CampoTraducible, string>
/** Lo que se guarda en `revisados`: qué campos tocó un humano. */
export type MapaRevisados = Record<CampoTraducible, boolean>

/**
 * Huella del valor original de un campo.
 *
 * Se recorta a 12 caracteres a propósito: sirve para comparar «¿cambió esto?»,
 * no para nada criptográfico, y así la columna Json no engorda sin motivo.
 * Las listas se unen con un separador que no aparece en texto escrito, para que
 * ['a b'] y ['a','b'] den huellas distintas.
 */
export function huellaDe(valor: string | string[] | null | undefined): string {
  const texto = Array.isArray(valor) ? valor.join('\u0000') : (valor ?? '')
  return createHash('sha1').update(texto, 'utf8').digest('hex').slice(0, 12)
}

/** Huella de cada campo traducible del registro en español. */
export function huellasDe(
  origen: Record<string, unknown>,
  campos: readonly string[],
): MapaHuellas {
  const out: MapaHuellas = {}
  for (const campo of campos) {
    out[campo] = huellaDe(origen[campo] as string | string[])
  }
  return out
}

/**
 * Qué campos hay que (re)traducir.
 *
 * Tres motivos para traducir un campo, y uno para no hacerlo nunca:
 *
 *  - no hay huella guardada  → nunca se tradujo
 *  - la huella no coincide   → el admin cambió el español
 *  - el destino está vacío   → se tradujo pero se perdió
 *
 *  - está en `revisados`     → lo escribió un humano; la máquina no lo pisa,
 *                              solo queda marcado como desactualizado
 *
 * Esa última regla es la que evita que alguien dedique una tarde a pulir el
 * inglés y lo pierda porque se corrigió una coma en español.
 */
export function camposACambiar(
  origen: Record<string, unknown>,
  campos: readonly string[],
  huellaGuardada: MapaHuellas,
  destino: Record<string, unknown> | null,
  revisados: MapaRevisados = {},
): string[] {
  const actuales = huellasDe(origen, campos)
  return campos.filter(campo => {
    if (revisados[campo]) return false

    // Un campo vacío en español no se manda a traducir: DeepL cobraría por nada
    // y devolvería vacío igual.
    const valor = origen[campo]
    const vacio = Array.isArray(valor) ? valor.length === 0 : !String(valor ?? '').trim()
    if (vacio) return false

    if (huellaGuardada[campo] !== actuales[campo]) return true

    const traducido = destino?.[campo]
    return Array.isArray(traducido) ? traducido.length === 0 : !String(traducido ?? '').trim()
  })
}

/**
 * Campos cuya traducción quedó vieja pero que NO se van a reescribir, porque
 * los revisó un humano. Alimentan el aviso del panel.
 */
export function camposDesactualizados(
  origen: Record<string, unknown>,
  campos: readonly string[],
  huellaGuardada: MapaHuellas,
  revisados: MapaRevisados = {},
): string[] {
  const actuales = huellasDe(origen, campos)
  return campos.filter(
    campo => revisados[campo] && huellaGuardada[campo] !== actuales[campo],
  )
}

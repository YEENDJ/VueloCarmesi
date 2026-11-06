import { parrafosRelato } from './seo'

/** Un paso del programa de una experiencia, ya separado del relato. */
export interface PasoPrograma {
  /** El número que escribió el administrador. Null si el paso no lleva («Cierre»). */
  numero: number | null
  titulo: string
  detalles: string[]
}

export interface RelatoFicha {
  /** Lo que va antes del programa. Sin programa, es el relato entero. */
  apertura: string[]
  pasos: PasoPrograma[]
  /** Lo que queda después del último paso, como una frase de despedida. */
  despues: string[]
}

const VINETA = /^[-–—•*]\s+/
const NUMERO = /^(\d{1,2})[.)]\s+/
const GUION_EN_LINEA = /\s+[-–—]\s+/

/** Más largo que esto ya es una frase del relato, no el título de un paso. */
export const MAX_TITULO = 90

/** Dos pasos como mínimo: uno solo es un párrafo con una lista, no un programa. */
const MIN_PASOS = 2

/** «CIERRE DE LA EXPERIENCIA» → «Cierre de la experiencia». */
function sinMayusculasSostenidas(titulo: string): string {
  const todoMayusculas = titulo === titulo.toUpperCase() && titulo !== titulo.toLowerCase()
  if (!todoMayusculas) return titulo
  return titulo.charAt(0) + titulo.slice(1).toLowerCase()
}

function armarPaso(tituloCrudo: string, detalles: string[]): PasoPrograma | null {
  const numero = tituloCrudo.match(NUMERO)
  const titulo = tituloCrudo.replace(NUMERO, '').replace(/:$/, '').trim()
  if (!titulo || titulo.length > MAX_TITULO) return null
  return {
    numero: numero ? Number(numero[1]) : null,
    titulo: sinMayusculasSostenidas(titulo),
    detalles,
  }
}

function leerPaso(parrafo: string): PasoPrograma | null {
  const lineas = parrafo.split('\n').map(l => l.trim()).filter(Boolean)
  if (lineas.length === 0) return null

  if (lineas.length > 1) {
    const [titulo, ...resto] = lineas
    if (VINETA.test(titulo) || !resto.every(l => VINETA.test(l))) return null
    return armarPaso(titulo, resto.map(l => l.replace(VINETA, '')))
  }

  // DeepL devuelve los saltos simples aplanados: «1. Título - Uno. - Dos.». Sin
  // número se piden al menos dos detalles, para no confundir con un paso una
  // frase normal que lleve un inciso entre guiones.
  const [titulo, ...detalles] = lineas[0].split(GUION_EN_LINEA)
  if (detalles.length < (NUMERO.test(titulo) ? 1 : 2)) return null
  return armarPaso(titulo, detalles)
}

/**
 * Un paso sin número y con un solo detalle, aplanado: «Cierre - Gracias.». Por
 * sí solo no se distingue de una frase con inciso, así que solo se acepta justo
 * después de otro paso, donde ya se sabe que hay un programa en curso.
 */
function leerPasoSuelto(parrafo: string): PasoPrograma | null {
  if (parrafo.includes('\n')) return null
  const [titulo, ...detalles] = parrafo.split(GUION_EN_LINEA)
  return detalles.length === 1 ? armarPaso(titulo, detalles) : null
}

/**
 * Separa el programa paso a paso del resto del relato.
 *
 * El programa se escribe en el mismo campo que el relato, sin formato: un título
 * en su línea y debajo los detalles con guion, con una línea en blanco entre un
 * paso y otro. Es una convención, así que si alguien escribe distinto no se
 * rompe nada: `pasos` llega vacío y la ficha pinta el texto corrido.
 *
 * Los pasos tienen que ir seguidos. Un párrafo normal entre dos pasos deja todo
 * como relato, porque moverlo fuera de su sitio cambiaría lo que el texto dice.
 */
export function separarPrograma(parrafos: string[]): RelatoFicha {
  const leidos = parrafos.map(leerPaso)
  for (let i = 1; i < leidos.length; i++) {
    if (!leidos[i] && leidos[i - 1]) leidos[i] = leerPasoSuelto(parrafos[i])
  }
  const primero = leidos.findIndex(Boolean)
  const ultimo = leidos.findLastIndex(Boolean)
  const tramo = primero === -1 ? [] : leidos.slice(primero, ultimo + 1)

  if (tramo.length < MIN_PASOS || tramo.some(p => p === null)) {
    return { apertura: parrafos, pasos: [], despues: [] }
  }

  return {
    apertura: parrafos.slice(0, primero),
    pasos: tramo as PasoPrograma[],
    despues: parrafos.slice(ultimo + 1),
  }
}

/** El relato tal como lo edita el panel: tres partes en vez de un solo texto. */
export interface RelatoEditable {
  apertura: string
  pasos: PasoPrograma[]
  despues: string
}

/** Abre un relato guardado en el editor. Sin programa, todo va a la apertura. */
export function relatoEditable(texto: string): RelatoEditable {
  const { apertura, pasos, despues } = separarPrograma(parrafosRelato(texto))
  return { apertura: apertura.join('\n\n'), pasos, despues: despues.join('\n\n') }
}

/**
 * Un paso que el editor deja a medias no se puede guardar: `separarPrograma` no
 * lo reconocería y el programa entero se vería como texto corrido en la ficha.
 * Devuelve el problema para mostrárselo a quien edita, o null si todo está bien.
 */
export function problemaPrograma(pasos: PasoPrograma[]): string | null {
  if (pasos.length === 0) return null
  if (pasos.length < MIN_PASOS) return '«Qué vas a hacer» necesita al menos dos pasos. Agrega otro o quita este.'
  const posicion = pasos.findIndex(p => !p.titulo.trim() || p.detalles.every(d => !d.trim()))
  if (posicion !== -1) return `Al paso ${posicion + 1} de «Qué vas a hacer» le falta el título o un detalle.`
  return null
}

/**
 * Lo inverso de `relatoEditable`: arma el texto que se guarda y que luego lee
 * `separarPrograma`. Los números se recalculan, para que reordenar los pasos no
 * deje la secuencia desordenada, y se limpia lo que quien edita haya escrito a
 * mano por costumbre, como «1.» en el título o «- » en un detalle.
 */
export function componerRelato({ apertura, pasos, despues }: RelatoEditable): string {
  let numero = 0
  const bloques = pasos.map(paso => {
    const titulo = paso.titulo.trim().replace(VINETA, '').replace(NUMERO, '')
    const detalles = paso.detalles
      .map(d => d.trim().replace(VINETA, ''))
      .filter(Boolean)
      .map(d => `- ${d}`)
    const encabezado = paso.numero === null ? titulo : `${++numero}. ${titulo}`
    return [encabezado, ...detalles].join('\n')
  })
  return [apertura.trim(), ...bloques, despues.trim()].filter(Boolean).join('\n\n')
}

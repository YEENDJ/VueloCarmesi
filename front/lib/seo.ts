/** Donde Google recorta la meta description. Mismo tope que valida el backend. */
export const MAX_META = 160

/**
 * El texto que Google muestra bajo el título.
 *
 * Se prefiere el escrito a mano: un resumen pensado para vender rinde más que
 * uno cortado por una función. Pero dejarlo vacío no puede significar quedarse
 * sin descripción, así que cuando falta se toman las primeras frases del relato.
 *
 * El corte respeta la palabra y, si alcanza, cierra en el último punto: es
 * preferible una frase completa algo más corta que una cortada a la mitad.
 */
export function metaDescription(corta: string | undefined, larga: string | undefined): string {
  const escrita = corta?.trim()
  if (escrita) return escrita

  // Los saltos de línea del relato no aportan nada en un atributo meta.
  const texto = (larga ?? '').replace(/\s+/g, ' ').trim()
  if (!texto) return ''
  if (texto.length <= MAX_META) return texto

  const recorte = texto.slice(0, MAX_META)

  // Cerrar en un final de frase, pero solo si cae en la parte alta del recorte:
  // un punto a los 30 caracteres daría una meta demasiado corta para el snippet,
  // y en ese caso conviene aprovechar el espacio con más texto.
  const frase = Math.max(
    recorte.lastIndexOf('. '), recorte.lastIndexOf('! '), recorte.lastIndexOf('? '),
  )
  if (frase > MAX_META * 0.5) return recorte.slice(0, frase + 1)

  const espacio = recorte.lastIndexOf(' ')
  const cortado = (espacio > 0 ? recorte.slice(0, espacio) : recorte).trimEnd()

  // Los puntos suspensivos sobran si el corte ya cayó en un final de frase:
  // "…espacio.…" se lee como un error, no como una continuación.
  return /[.!?…]$/.test(cortado) ? cortado : cortado + '…'
}

/**
 * Parte el relato en párrafos, tal como los escribió el administrador.
 *
 * El corte es por línea en blanco y no por el primer punto: cortar por punto
 * se rompe con "Cra. 5" o "$1.500", y un texto sin puntos terminaba entero en
 * tipografía display de 30px. Con párrafos, quien escribe decide dónde cae el
 * corte pulsando Enter, que es justo el control que se espera tener.
 *
 * El primero abre el relato en cursiva grande y el resto va en cuerpo; un
 * relato de un solo párrafo devuelve un solo elemento y se muestra entero en
 * la entradilla, sin cuerpo debajo.
 */
export function parrafosRelato(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
}

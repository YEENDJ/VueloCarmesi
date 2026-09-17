/**
 * Lista el texto en español que sigue incrustado en un componente o página.
 *
 *   node scripts/extraer-textos.mjs components/booking/ExperienciaCard.tsx
 *   node scripts/extraer-textos.mjs "app/[locale]/(public)/(shop)"      (carpeta)
 *
 * Es la herramienta de la migración a i18n: dice qué falta por sacar a
 * messages/*.json. Ignora comentarios, imports, estilos en línea y todo lo que
 * no es texto de cara al visitante (rutas, clases, tokens de color).
 *
 * No modifica nada. Solo lee y reporta.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

/** Texto que parece código y no contenido: rutas, clases, identificadores. */
const PARECE_CODIGO = /^[\w\-./@:#%()[\]{}$*+,;=&?!|~^<>'"\\ ]*$/
const TIENE_LETRA_ES = /[a-záéíóúñü]/i

function archivos(ruta) {
  if (statSync(ruta).isFile()) return [ruta]
  return readdirSync(ruta).flatMap(n => {
    const p = join(ruta, n)
    if (statSync(p).isDirectory()) return archivos(p)
    return ['.tsx', '.ts'].includes(extname(n)) && !n.includes('.test.') ? [p] : []
  })
}

function limpiar(src) {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // comentarios JSX
    .replace(/\/\*[\s\S]*?\*\//g, '') // comentarios de bloque
    .replace(/^\s*\/\/.*$/gm, '') // comentarios de línea
    .replace(/^\s*import .*$/gm, '')
    .replace(/\bstyle=\{\{[\s\S]*?\}\}/g, '') // estilos en línea
    .replace(/(className|href|src|id|key|name|type|rel|target)="[^"]*"/g, '')
}

function extraer(ruta) {
  const src = limpiar(readFileSync(ruta, 'utf8'))
  const hallazgos = new Map()

  const guardar = (texto, tipo) => {
    const t = texto.replace(/\s+/g, ' ').trim()
    if (t.length < 3) return
    if (!TIENE_LETRA_ES.test(t)) return
    if (PARECE_CODIGO.test(t) && !/\s/.test(t)) return // una sola palabra sin espacios: casi seguro código
    if (!hallazgos.has(t)) hallazgos.set(t, tipo)
  }

  // Texto suelto entre etiquetas
  for (const m of src.matchAll(/>\s*([^<>{}][^<>{}]*?)\s*</g)) guardar(m[1], 'jsx')

  // Texto PARTIDO por interpolaciones: `…hectáreas crecen {x} plantas de…`.
  //
  // El patrón de arriba solo ve texto que empieza tras `>` y termina antes de
  // `<`. Un párrafo con un valor interpolado en medio no cumple eso en ninguno
  // de sus trozos, así que es invisible. Por ahí se colaron la descripción de
  // Finca La Fortuna, «Hasta N personas», «Quedan solo N unidades» y «Subtotal
  // N unidades»: todas llevaban una cifra dentro.
  //
  // Las expresiones se sustituyen por un carácter que nunca aparece en texto
  // escrito, para usarlo como frontera igual que `<` y `>`. Un espacio no
  // serviría: los hay por todas partes y cortaría cada palabra.
  const HUECO = String.fromCharCode(1)
  const sinExpresiones = src.replace(/\{[^{}]*\}/g, HUECO)
  // El texto ABRE tras `>` o tras un hueco, nunca tras `<`: ahí empieza una
  // etiqueta, y aceptarlo hacía que `<ExperienciaCard key=` saliera como si
  // fuera contenido. Cierra en cualquiera de los tres.
  const abre = `[>${HUECO}]`
  const cierra = `[<>${HUECO}]`
  const dentro = `[^<>${HUECO}]`
  for (const m of sinExpresiones.matchAll(
    new RegExp(`${abre}\\s*(${dentro}{3,}?)\\s*${cierra}`, 'g'),
  )) {
    // Un `=` delata sintaxis de prop, no prosa.
    if (!m[1].includes('=')) guardar(m[1], 'jsx-partido')
  }

  // Literales de cadena con pinta de frase (tienen espacio y letras)
  for (const m of src.matchAll(/'([^'\n]{4,})'|"([^"\n]{4,})"/g)) {
    const t = m[1] ?? m[2]
    if (/\s/.test(t) && TIENE_LETRA_ES.test(t)) guardar(t, 'literal')
  }
  // Atributos que el visitante sí lee
  for (const m of src.matchAll(/(aria-label|title|placeholder|alt)="([^"]{3,})"/g)) {
    guardar(m[2], m[1])
  }
  return hallazgos
}

const objetivo = process.argv[2]
if (!objetivo) {
  console.error('Uso: node scripts/extraer-textos.mjs <archivo-o-carpeta>')
  process.exit(1)
}

let total = 0
for (const ruta of archivos(objetivo)) {
  const hallazgos = extraer(ruta)
  if (hallazgos.size === 0) continue
  console.log(`\n==== ${ruta}  (${hallazgos.size})`)
  for (const [texto, tipo] of hallazgos) {
    console.log(`  [${tipo}] ${texto}`)
    total++
  }
}
console.log(`\n${total} cadenas por migrar en ${objetivo}\n`)

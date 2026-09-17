/**
 * Busca español sin traducir en el sitio público.
 *
 *   node scripts/buscar-espanol.mjs
 *
 * Es el complemento de extraer-textos.mjs y existe porque aquel falla por
 * omisión: intenta adivinar qué trozos son «texto» y se le escapan los que no
 * encajan en su patrón —los partidos por interpolaciones, los que viven en un
 * array de datos, los de un módulo que no es un componente—. Varias cadenas se
 * colaron así hasta producción.
 *
 * Este invierte el criterio: en vez de buscar texto, busca ESPAÑOL. Cualquier
 * cadena con acentos, eñes, signos de apertura o palabras funcionales
 * castellanas es sospechosa, esté donde esté. Prefiere el falso positivo al
 * silencio: un nombre propio de más en la lista se descarta de un vistazo, una
 * cadena sin traducir no se ve hasta que la encuentra un visitante.
 *
 * El panel de administración queda fuera a propósito: está en español.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const RAICES = ['app/[locale]', 'components', 'lib']

/**
 * Fuera del barrido, y por qué:
 *
 * - `admin`  : el panel está en español a propósito.
 * - `lib/api`: los mocks de desarrollo y los mensajes de `console.error`. Los
 *              primeros solo se pintan si el backend no responde y NODE_ENV no
 *              es production; los segundos van a la consola del servidor, no a
 *              la pantalla de nadie.
 * - `slugs-legados`: un mapa de URLs viejas a nuevas. Son datos, no texto.
 */
const EXCLUIR =
  /[\\/]admin[\\/]|[\\/]i18n[\\/]|\.test\.|scripts[\\/]|lib[\\/]api[\\/]|slugs-legados/

/** Marcadores inequívocos del castellano escrito. */
const ACENTOS = /[áéíóúñü¿¡Á-ÚÑ]/
const PALABRAS =
  /\b(de|la|el|los|las|un|una|unos|unas|con|por|para|que|del|al|se|su|sus|y|en|no|más|desde|hasta|cada|todo|toda|todos|todas|este|esta|esto|pero|como|cuando|donde|nuestro|nuestra|tu|te|tus|lo|le|les)\b/i

/**
 * Lo que puede parecer español y no lo es, o lo es a propósito.
 *
 * Nombres propios, términos que no se traducen y el bloque en inglés que solo
 * se pinta en la versión española.
 */
const PERMITIDO = [
  /Vuelo Carmes/i, /Finca La Fortuna/i, /Brisas del Tonoa/i, /Cubarral/i, /Sumapaz/i,
  /Ariari/i, /Villavicencio/i, /Acac[íi]as/i, /Guamal/i, /Morena Roja/i, /Limon[áa]tica/i,
  /ARICAO|CARAO|MUJARI|Paradiso|Rinc[óo]n|Sue[ñn]o salvaje/i, /El Ed[ée]n/i,
  /Cristian|Mar[íi]a Uma[ñn]a|Orlando|Yuri|Yeison|Enciso/i,
  /V[íi]a al Llano/i, /piedemonte llanero/i, /XyraCode/i,
  // Nombres de especies: científicos, ingleses y populares colombianos.
  /Pteroglossus|Eurypyga|Campephilus|Cissopis|Piranga|Setophaga|Glaucidium|Cyanocorax|Thraupis/i,
  /Pich[íi]|Carpintero real|Currucut[úu]|Carriqu[íi]|Azulejo|Tangara|T[áa]ngara|Candelita|Tigana/i,
  // Claves de traducción y de SiteConfig: parecen palabras pero no se leen.
  /^[a-z]+([A-Z][a-z]+)*$/, /^[a-z_]+$/,
  // Una clave con interpolación dentro: `cuando.${clave}.nota`. Es la ruta a
  // un mensaje del catálogo, no el mensaje.
  /^[a-z]+[\w.$]*\$\{/i, /^[a-z]+\.[a-z$]/i,
  // Rutas, URLs y nombres de archivo.
  /^\/|^https?:|\.(jpg|png|webp|svg|woff2?)$|^\$\{SITIO\}/i,
  /^no-referrer|^[a-z-]+$/,
]

function archivos(ruta) {
  if (!statSync(ruta, { throwIfNoEntry: false })) return []
  if (statSync(ruta).isFile()) return [ruta]
  return readdirSync(ruta).flatMap(n => {
    const p = join(ruta, n)
    if (EXCLUIR.test(p)) return []
    if (statSync(p).isDirectory()) return archivos(p)
    return ['.tsx', '.ts'].includes(extname(n)) ? [p] : []
  })
}

function limpiar(src) {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*import .*$/gm, '')
    .replace(/\bstyle=\{\{[\s\S]*?\}\}/g, '')
    .replace(/(className|href|src|id|key)="[^"]*"/g, '')
}

const esEspanol = t => ACENTOS.test(t) || PALABRAS.test(t)
const permitido = t => PERMITIDO.some(re => re.test(t))

function revisar(ruta) {
  const src = limpiar(readFileSync(ruta, 'utf8'))
  const vistos = new Set()
  const sospechosas = []

  const mirar = texto => {
    const t = texto.replace(/\s+/g, ' ').trim()
    if (t.length < 4 || vistos.has(t)) return
    vistos.add(t)
    // Una cadena ya traducida pasa por t(...) y aquí llega la clave, no el texto.
    if (!esEspanol(t) || permitido(t)) return
    sospechosas.push(t)
  }

  // Todo literal de cadena del archivo, sin importar dónde viva.
  for (const m of src.matchAll(/'([^'\n]{4,})'|"([^"\n]{4,})"|`([^`\n]{4,})`/g)) {
    mirar(m[1] ?? m[2] ?? m[3])
  }
  // Texto JSX, incluido el partido por interpolaciones.
  const HUECO = String.fromCharCode(1)
  const plano = src.replace(/\{[^{}]*\}/g, HUECO)
  const dentro = `[^<>${HUECO}]`
  for (const m of plano.matchAll(
    new RegExp(`[>${HUECO}]\\s*(${dentro}{4,}?)\\s*[<>${HUECO}]`, 'g'),
  )) {
    if (!m[1].includes('=')) mirar(m[1])
  }
  return sospechosas
}

let total = 0
for (const raiz of RAICES) {
  for (const ruta of archivos(raiz)) {
    const s = revisar(ruta)
    if (s.length === 0) continue
    console.log(`\n${relative('.', ruta)}`)
    for (const t of s) {
      console.log(`  · ${t.length > 110 ? t.slice(0, 110) + '…' : t}`)
      total++
    }
  }
}
console.log(
  total === 0
    ? '\nSin español sin traducir en el sitio público.\n'
    : `\n${total} cadenas sospechosas. Revisa una a una: puede haber falsos positivos.\n`,
)

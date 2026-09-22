import { NOMBRES_PROPIOS } from '../traduccion/glosario'

/**
 * Normaliza la capitalización del nombre de una ficha.
 *
 * El panel es un campo de texto libre y el catálogo entró por ahí a lo largo de
 * meses, así que la misma estantería tiene `chocolate ARICAO 100% x 125 gramos`,
 * `Chocolate ARICAO 100% x 500 gramos` y `AVISTAMIENTO DE AVES`. El nombre no se
 * queda en la ficha: es el `<title>` —el texto azul del resultado en Google—, el
 * `<h1>`, el JSON-LD, la línea del carrito, el asunto del correo de pedido y el
 * aviso de Telegram. Una versalita ahí se lee como un grito y una minúscula
 * inicial como un descuido.
 *
 * La regla es **una sola**: una palabra ESCRITA TODA EN MAYÚSCULAS que no sea un
 * nombre propio conocido pasa a minúsculas, y luego se capitaliza la primera
 * letra del nombre. Mayúscula de frase, que es la convención del español —
 * «Mascarilla de cacao + refrigerio», no «Mascarilla De Cacao + Refrigerio».
 *
 * Lo que NO toca, a propósito:
 *
 * - Las palabras que ya vienen en minúscula o en mixta. Si el admin escribió
 *   «Chocolate instantáneo en polvo», eso está bien y nadie tiene que adivinar
 *   nada. Solo se corrige lo que es inequívocamente un error de tecleo.
 * - Los números y las unidades: `100%`, `375`, `ml` no llevan letra mayúscula ni
 *   la pierden porque `esVersalita` exige al menos una letra.
 * - Las tildes. `RUTA CAFE Y CACAO` sale de aquí como `Ruta cafe y cacao`: poner
 *   el acento requiere un diccionario del español, no una regla de formato, y
 *   adivinarlo daría «mas» → «más» donde el admin quería «mas». Las cuatro
 *   fichas con tilde comida se arreglan a mano una vez.
 *
 * El precio de la regla: una marca nueva escrita en versalita y NO registrada en
 * el glosario se convierte en minúsculas. Es deliberado — el glosario ya es el
 * sitio donde hay que dar de alta cualquier nombre propio del catálogo, porque
 * sin eso DeepL lo traduce como si fuera una palabra corriente y «Rincón» sale
 * al inglés como «Corner». Registrar la marca allá arregla las dos cosas de una
 * vez; no registrarla ya estaba roto antes de que existiera este archivo.
 */
export function capitalizarNombre(nombre: string): string {
  const palabras = nombre.trim().replace(/\s+/g, ' ').split(' ')

  const normalizadas = palabras.map(palabra =>
    esVersalita(palabra) && !CONSERVAR.has(clave(palabra))
      ? palabra.toLowerCase()
      : palabra,
  )

  // La mayúscula va en la PRIMERA palabra y solo ahí. Si esa palabra no tiene
  // letras —«70% cacao en barra», «100% ARICAO»— no se mueve a la siguiente:
  // «70% Cacao en barra» pone una mayúscula a mitad de frase, que es un error
  // distinto del que vinimos a arreglar. El reemplazo busca la primera letra
  // dentro de la palabra, no el primer carácter, para que «(chocolate)» salga
  // como «(Chocolate)» y no se quede con el paréntesis comiéndose el turno.
  const primera = normalizadas[0]
  if (primera !== undefined && !CONSERVAR.has(clave(primera))) {
    normalizadas[0] = primera.replace(/\p{L}/u, l => l.toUpperCase())
  }

  return normalizadas.join(' ')
}

/**
 * Las palabras que se dejan exactamente como se escribieron.
 *
 * Sale del glosario de traducción —el mismo `NOMBRES_PROPIOS` que le prohíbe a
 * DeepL tocar ARICAO, MUJARI o Rincón— y no de una lista propia, para que
 * registrar una marca nueva siga siendo un solo gesto en un solo archivo. Dos
 * listas con los mismos nombres se desincronizan el día que alguien añade una
 * marca a una y no a la otra, y el síntoma sería silencioso: la ficha guardada
 * en minúsculas o el inglés con la marca traducida.
 *
 * Los términos de varias palabras se parten: de «Vuelo Carmesí» se conservan
 * «vuelo» y «carmesí» por separado, porque la regla mira palabra a palabra.
 */
const CONSERVAR = new Set(
  NOMBRES_PROPIOS.flatMap(termino => termino.split(/\s+/)).map(clave),
)

/**
 * La forma comparable de una palabra: sin acentos, sin signos y en minúsculas.
 *
 * Se compara así y no por igualdad de texto porque la palabra llega del panel
 * tal como la tecleó una persona: «RINCON» sin tilde, «ARICAO,» con la coma
 * pegada y «(MUJARI)» entre paréntesis tienen que reconocerse como el nombre
 * propio que son. Es el mismo aplanado que hace `toSlug`.
 */
function clave(palabra: string): string {
  return palabra
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

/**
 * Si la palabra está escrita toda en mayúsculas.
 *
 * La segunda condición es la que salva a los números y a las unidades: `375` y
 * `100%` son iguales en mayúsculas y en minúsculas, así que sin ella contarían
 * como versalita y el bucle los «corregiría» sin necesidad.
 */
function esVersalita(palabra: string): boolean {
  return palabra === palabra.toUpperCase() && palabra !== palabra.toLowerCase()
}

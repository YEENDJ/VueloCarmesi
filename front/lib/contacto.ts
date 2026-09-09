/**
 * Datos de contacto del proyecto, en un solo sitio.
 *
 * Antes vivían sueltos dentro del Footer y la página de contacto no los tenía:
 * el formulario incluso ofrecía un correo que no existe. Todo lo que muestre un
 * teléfono, un correo o una red sale de aquí, para que cambiar el número sea un
 * solo cambio y no una cacería por el proyecto.
 */

const NUMERO_E164 = '+573118171907'

/**
 * Enlace de WhatsApp con el mensaje ya escrito.
 *
 * El texto cambia segun desde donde se hizo clic: quien pregunta como llegar no
 * quiere el mismo mensaje que quien pide precios. Llega escrito y el visitante
 * solo pulsa enviar, asi que del otro lado se sabe de entrada que necesita.
 */
export const whatsappCon = (mensaje: string) =>
  `https://wa.me/${NUMERO_E164}?text=${encodeURIComponent(mensaje)}`

export const MENSAJE_WHATSAPP = {
  contacto:
    '¡Hola! Escribo desde la página de Vuelo Carmesí y quiero más información sobre las experiencias.',
  comoLlegar:
    '¡Hola! Estoy en la página de Vuelo Carmesí y tengo dudas de cómo llegar a la finca. ¿Me ayudan con las indicaciones?',
  general:
    '¡Hola! Los encontré en la página de Vuelo Carmesí y quiero hacerles una consulta.',
} as const

export const CONTACTO = {
  email: 'carmesivuelo@gmail.com',
  /** Para mostrar: agrupado como se lee un número colombiano */
  telefono: '+57 311 817 1907',
  /** Para enlazar: sin espacios, como lo piden tel: y wa.me */
  telefonoE164: NUMERO_E164,
  whatsapp: `https://wa.me/${NUMERO_E164}`,
  direccion: 'Finca La Fortuna, Vereda Brisas del Tonoa',
  municipio: 'Cubarral, Meta, Colombia',
  direccionCompleta:
    'Finca La Fortuna, Vereda Brisas del Tonoa, Cubarral, Meta, Colombia',
} as const

/**
 * Ubicacion de la finca, tomada del pin de Google Maps.
 *
 * Ojo si algun dia se actualiza: la URL de Maps trae dos pares de coordenadas y
 * el primero (3.7917639, -73.8412171) es el de la Emisora Brisas del Tonoa, no
 * el de la finca. El bueno es el del ultimo bloque `!3d...!4d...`, el que va
 * junto al identificador de «Finca la Fortuna».
 */
const COORDENADAS = '3.7537786,-73.8743938'

/**
 * Encuadre fijo del mapa embebido.
 *
 * `CENTRO` y `ZOOM` mandan sobre lo que Google elegiria por su cuenta: a este
 * nivel se ven a la vez la finca, Cubarral y el rio Ariari, que es el contexto
 * que necesita alguien que no conoce la zona. Con el zoom por defecto la vista
 * queda tan cerca que no se reconoce nada alrededor.
 *
 * Para cambiarlo: encuadra el mapa como lo quieras en Google Maps y copia la
 * URL; el tramo `@latitud,longitud,zoom` de esa direccion es exactamente
 * `CENTRO` y `ZOOM`. El pin (`COORDENADAS`) no se toca.
 */
const CENTRO = '3.7714,-73.8672'
const ZOOM = 13

export const MAPA = {
  coordenadas: COORDENADAS,
  /** Mapa embebido: pin en la finca, encuadre fijo y rotulos en espanol */
  embed: `https://www.google.com/maps?q=${COORDENADAS}&ll=${CENTRO}&z=${ZOOM}&hl=es&output=embed`,
  /** Abre la ficha del lugar */
  enlace: `https://www.google.com/maps/search/?api=1&query=${COORDENADAS}`,
  /** Arranca la navegacion desde donde este el visitante */
  rutas: `https://www.google.com/maps/dir/?api=1&destination=${COORDENADAS}`,
} as const

export const REDES = {
  instagram:
    'https://www.instagram.com/vuelo_carmesi?igsh=MWUxdjc1djRyc2Y2OQ==',
  facebook: 'https://www.facebook.com/share/1D4zy8b9HB/',
  tiktok: 'https://www.tiktok.com/@vuelo_carmesi?_r=1&_t=ZS-97S50KhhcwC',
} as const

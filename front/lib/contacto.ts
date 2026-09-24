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
 *
 * Los textos viven en el catalogo, bajo `whatsapp.*`, y no aqui: el visitante
 * de /en escribe en ingles, y un mensaje que llega en otro idioma que el de la
 * pagina que estaba leyendo no parece suyo. Un boton nuevo se lleva su propia
 * clave en los dos catalogos en vez de reciclar la de otra pagina.
 *
 * `numero` existe para la ficha de experiencia, que usa el de Configuracion.
 * wa.me solo admite digitos —ni el «+» ni espacios—, asi que se limpia aqui.
 */
export const whatsappCon = (mensaje: string, numero: string = NUMERO_E164) =>
  `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`

/**
 * Un número tal como lo escribió alguien en un formulario, listo para wa.me.
 *
 * Los formularios aceptan «311 000 0000» sin indicativo, y wa.me sin indicativo
 * abre un chat con un número de otro país. Diez dígitos que empiezan por 3 son
 * un celular colombiano: se les antepone el 57. Cualquier otra cosa se deja
 * como vino, porque adivinar el país de un número extranjero es peor.
 */
export function numeroWhatsapp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '')
  return digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos
}

export const CONTACTO = {
  email: 'carmesivuelo@gmail.com',
  /** Para mostrar: agrupado como se lee un número colombiano */
  telefono: '+57 311 817 1907',
  /** Para enlazar: sin espacios, como lo piden tel: y wa.me */
  telefonoE164: NUMERO_E164,
  whatsapp: `https://wa.me/${NUMERO_E164.replace(/\D/g, '')}`,
  direccion: 'Finca La Fortuna, Vereda Brisas del Tonoa',
  municipio: 'Cubarral, Meta, Colombia',
  direccionCompleta:
    'Finca La Fortuna, Vereda Brisas del Tonoa, Cubarral, Meta, Colombia',
  // Las tres piezas sueltas de `municipio`. Hacen falta porque un PostalAddress
  // de schema.org no acepta «Cubarral, Meta, Colombia» en un solo campo: pide
  // localidad, region y pais por separado, y el pais en ISO 3166-1 de dos
  // letras. Se guardan aqui en lugar de trocear la cadena en el consumidor
  // para que el dia que cambie la sede se cambie en un solo sitio.
  localidad: 'Cubarral',
  region: 'Meta',
  pais: 'CO',
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
 * Las mismas coordenadas como numeros.
 *
 * La cadena de arriba es la que piden las URL de Google Maps; un GeoCoordinates
 * de schema.org pide dos numeros. Se derivan de `COORDENADAS` en vez de
 * escribirse otra vez para que no puedan quedar dos pines distintos en el sitio.
 */
const [LATITUD, LONGITUD] = COORDENADAS.split(',').map(Number)

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
  latitud: LATITUD,
  longitud: LONGITUD,
  /** Mapa embebido: pin en la finca, encuadre fijo y rotulos en espanol */
  embed: `https://www.google.com/maps?q=${COORDENADAS}&ll=${CENTRO}&z=${ZOOM}&hl=es&output=embed`,
  /** Abre la ficha del lugar */
  enlace: `https://www.google.com/maps/search/?api=1&query=${COORDENADAS}`,
  /** Arranca la navegacion desde donde este el visitante */
  rutas: `https://www.google.com/maps/dir/?api=1&destination=${COORDENADAS}`,
} as const

/**
 * URLs canonicas de cada perfil, sin los parametros que anade el boton de
 * «Compartir» (`?igsh=`, `?_r=&_t=`, `/share/<token>/`): alimentan `sameAs`,
 * que es una afirmacion de identidad, y un enlace de compartir puede caducar
 * sin que nadie lo note.
 */
export const REDES = {
  instagram: 'https://www.instagram.com/vuelo_carmesi',
  facebook: 'https://www.facebook.com/fincalafortunacubarral/',
  tiktok: 'https://www.tiktok.com/@vuelo_carmesi',
  /**
   * Ficha de Google Business, la del panel de Google Maps.
   *
   * Va vacia porque el negocio todavia no nos ha pasado la URL de su perfil, y
   * en `sameAs` las vacias se descartan: es preferible un perfil de menos que
   * inventarse un enlace, porque ahi `sameAs` es justo la afirmacion de «esta
   * cuenta es nuestra». Cuando llegue se pega aqui —el enlace corto de
   * «Compartir» en la ficha, del estilo https://maps.app.goo.gl/…— y entra sola
   * en los datos estructurados sin tocar nada mas.
   */
  google: '',
} as const

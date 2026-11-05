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
  /**
   * Otros nombres de la misma finca, para el `alternateName` del JSON-LD. El
   * largo es el de la ficha de Google y el de los textos legales; La Fortuna es
   * como se llamó antes, y declararlo evita que un perfil o una mención vieja se
   * lean como otro negocio.
   */
  nombresAlternos: ['Finca Agroturística Vuelo Carmesí', 'Finca La Fortuna'],
  /** Para enlazar: sin espacios, como lo piden tel: y wa.me */
  telefonoE164: NUMERO_E164,
  whatsapp: `https://wa.me/${NUMERO_E164.replace(/\D/g, '')}`,
  direccion: 'Finca Agroturística Vuelo Carmesí, Vereda Brisas del Tonoa',
  municipio: 'Cubarral, Meta, Colombia',
  direccionCompleta:
    'Finca Agroturística Vuelo Carmesí, Vereda Brisas del Tonoa, Cubarral, Meta, Colombia',
  // Sin el nombre de la finca: los textos legales ya la nombran como sujeto
  // («La Finca Agroturística Vuelo Carmesí, con domicilio en …») y con
  // `direccionCompleta` el nombre saldría dos veces en la misma frase.
  domicilio: 'Vereda Brisas del Tonoa, Cubarral, Meta, Colombia',
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
 * junto al identificador de la finca en Maps.
 */
const COORDENADAS = '3.7537803,-73.8743929'

/**
 * La ficha de la finca en Google Maps, de la que salen el mapa y las rutas.
 *
 * `PLACE_ID` identifica la misma ficha que `FICHA_GOOGLE` y que el mapa embebido
 * (`0x8e3e6d7249387ab7:0xf1aba85f2c37f19b` en sus URL). Con el, «Como llegar»
 * lleva al negocio por su nombre y no a un punto suelto del mapa.
 */
const FICHA_GOOGLE = 'https://maps.app.goo.gl/vjJWZWNDrpQqpqzN7'
const PLACE_ID = 'ChIJt3o4SXJtPo4Rm_E3LF-oq_E'

/**
 * Las mismas coordenadas como numeros.
 *
 * La cadena de arriba es la que piden las URL de Google Maps; un GeoCoordinates
 * de schema.org pide dos numeros. Se derivan de `COORDENADAS` en vez de
 * escribirse otra vez para que no puedan quedar dos pines distintos en el sitio.
 */
const [LATITUD, LONGITUD] = COORDENADAS.split(',').map(Number)

export const MAPA = {
  coordenadas: COORDENADAS,
  latitud: LATITUD,
  longitud: LONGITUD,
  /**
   * Mapa embebido con la ficha de la finca. Es la URL de «Insertar un mapa» de
   * Google Maps: para cambiar el encuadre se genera otra desde ahi.
   */
  embed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.2585874767856!2d-73.8743929!3d3.7537802999999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3e6d7249387ab7%3A0xf1aba85f2c37f19b!2sFinca%20Agroturistica%20Vuelo%20Carmesi!5e0!3m2!1ses!2sco!4v1793894380120!5m2!1ses!2sco',
  /** Abre la ficha del lugar */
  enlace: FICHA_GOOGLE,
  /**
   * Arranca la navegacion desde donde este el visitante. Las coordenadas son el
   * destino de respaldo si Google no reconoce el `PLACE_ID`.
   */
  rutas: `https://www.google.com/maps/dir/?api=1&destination=${COORDENADAS}&destination_place_id=${PLACE_ID}`,
} as const

/**
 * URLs canonicas de cada perfil, sin los parametros que anade el boton de
 * «Compartir» (`?igsh=`, `?_r=&_t=`, `/share/<token>/`): alimentan `sameAs`,
 * que es una afirmacion de identidad, y un enlace de compartir puede caducar
 * sin que nadie lo note.
 */
export const REDES = {
  instagram: 'https://www.instagram.com/vuelo_carmesi',
  facebook: 'https://facebook.com/fincaagroturisticavuelocarmesi',
  tiktok: 'https://www.tiktok.com/@vuelo_carmesi',
  /**
   * Ficha de Google Business, la del panel de Google Maps.
   *
   * Es la excepcion a lo de arriba: es el enlace corto de «Compartir» en Google
   * Maps. Si algun dia deja de abrir la ficha, se copia otro desde ahi; el de
   * «Compartir» en la busqueda de Google no sirve porque abre la busqueda.
   * Alimenta `sameAs` y el icono de Google en el pie y en /contacto.
   */
  google: FICHA_GOOGLE,
} as const

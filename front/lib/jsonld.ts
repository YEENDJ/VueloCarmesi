import { CONTACTO, MAPA, REDES } from '@/lib/contacto'
import { IDIOMAS, type Idioma } from '@/lib/i18n/routing'
import { SITIO } from '@/lib/sitio'

/**
 * Los datos estructurados que declaran quién es el negocio.
 *
 * Antes de esto, de doce URLs del sitio solo /aviturismo y /en/birding servían
 * JSON-LD, y lo que declaraban era una atracción turística: en ninguna página
 * había un nodo que dijera quién la publica. Para un buscador eso significa que
 * el cacao, las experiencias y la finca eran tres cosas sueltas y no el mismo
 * negocio, y por eso ni el teléfono, ni la dirección, ni las redes contaban
 * como señales de una entidad.
 *
 * Va todo en un `@graph` y no en bloques separados porque los nodos se
 * referencian entre sí por `@id`: el sitio web apunta a su editor sin repetirle
 * el nombre y la dirección. Los `@id` son absolutos y estables —se construyen
 * sobre SITIO, nunca sobre la URL de la página— porque un identificador que
 * cambie de una ruta a otra crea una entidad nueva en cada página en vez de
 * acumular todas las señales sobre la misma.
 *
 * Todos los valores salen de `lib/contacto.ts`. Ninguno se escribe a mano aquí:
 * el día que cambie el teléfono, este archivo no se toca.
 */

/**
 * El identificador del negocio. Se exporta para que lo que se marque más
 * adelante —los productos de la tienda, las fichas de experiencia— se cuelgue
 * de él con `{ '@id': ID_NEGOCIO }` en vez de volver a describir al vendedor.
 */
export const ID_NEGOCIO = `${SITIO}/#negocio`

/** El identificador del sitio web, para lo mismo: `isPartOf`, `publisher`. */
export const ID_SITIO = `${SITIO}/#sitio`

const ID_LOGO = `${SITIO}/#logo`

/**
 * La banda de precio, en la escala de uno a cuatro que entiende Google.
 *
 * No es el precio de nada concreto —esos los administra el panel y aquí
 * quedarían desactualizados—, sino el tramo en el que cae la oferta. Si algún
 * día el catálogo sube de nivel, se cambia esta constante.
 */
const BANDA_DE_PRECIO = '$$'

/**
 * Hasta dónde llega el negocio.
 *
 * No es la dirección otra vez: `address` dice dónde está la finca y `areaServed`
 * de dónde vienen los visitantes. Es lo que permite aparecer ante alguien que
 * busca desde Bogotá sin que el buscador tenga que adivinarlo por la distancia.
 */
const AREA_ATENDIDA = [
  {
    '@type': 'AdministrativeArea',
    name: 'Meta',
    address: { '@type': 'PostalAddress', addressRegion: 'Meta', addressCountry: 'CO' },
  },
  {
    '@type': 'City',
    name: 'Villavicencio',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Villavicencio',
      addressRegion: 'Meta',
      addressCountry: 'CO',
    },
  },
  {
    '@type': 'City',
    name: 'Bogotá',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bogotá',
      addressRegion: 'Bogotá D.C.',
      addressCountry: 'CO',
    },
  },
]

/**
 * Los perfiles que confirman que la cuenta es nuestra.
 *
 * Se descartan los vacíos: `google` está pendiente de que el negocio pase la
 * URL de su ficha, y un enlace inventado en `sameAs` es una afirmación falsa
 * sobre la identidad, no un campo incompleto.
 */
const perfiles = () =>
  [REDES.instagram, REDES.facebook, REDES.tiktok, REDES.google].filter(Boolean)

/**
 * Los idiomas del sitio en BCP 47, que es la etiqueta que pide `inLanguage`.
 *
 * Se recorre `IDIOMAS` en vez de escribir la lista a mano para que un tercer
 * idioma aparezca aquí solo: el mapa lo obliga a declarar su etiqueta, y si no
 * lo hace deja de compilar en vez de servir un sitio que se describe a medias.
 * El español es el de Colombia; el inglés va sin región porque el sitio no está
 * escrito para un país anglófono en concreto.
 */
const BCP47: Record<Idioma, string> = { es: 'es-CO', en: 'en' }

/**
 * La etiqueta de idioma de una página suelta, para los nodos que declaran cada
 * página por su cuenta —el `ContactPage` de /contacto, por ejemplo—.
 *
 * Sale de aquí y no de un ternario en cada página porque el mapa de arriba es
 * la única definición de qué etiqueta le corresponde a cada idioma: una copia
 * escrita a mano diría `es` donde el nodo del sitio dice `es-CO`, y las dos
 * afirmaciones acabarían contradiciéndose sobre la misma URL.
 *
 * El respaldo cubre el caso de un `locale` que llegue como texto suelto de la
 * ruta; el layout ya rechaza los que no son idiomas del sitio.
 */
export const etiquetaDeIdioma = (locale: string) =>
  BCP47[locale as Idioma] ?? BCP47.es

export function grafoDelSitio({
  nombre,
  descripcion,
}: {
  nombre: string
  descripcion: string
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // Los dos tipos a la vez: `LocalBusiness` es lo que habilita la ficha
        // con dirección, mapa y teléfono, y `Organization` es el tipo que
        // esperan las propiedades que luego cuelgan de él —`publisher`,
        // `seller`, `brand`—. LocalBusiness ya deriva de Organization, pero
        // declararlo explícitamente ahorra que un consumidor tenga que
        // resolver la jerarquía para aceptarlo.
        '@type': ['Organization', 'LocalBusiness'],
        '@id': ID_NEGOCIO,
        name: nombre,
        description: descripcion,
        url: `${SITIO}/`,
        logo: {
          '@type': 'ImageObject',
          '@id': ID_LOGO,
          url: `${SITIO}/images/marca/logo-crimson.png`,
          width: 1600,
          height: 256,
        },
        image: `${SITIO}/images/cacao/cacaotal-mazorcas-rojas.jpg`,
        telephone: CONTACTO.telefonoE164,
        email: CONTACTO.email,
        priceRange: BANDA_DE_PRECIO,
        currenciesAccepted: 'COP',
        address: {
          '@type': 'PostalAddress',
          streetAddress: CONTACTO.direccion,
          addressLocality: CONTACTO.localidad,
          addressRegion: CONTACTO.region,
          addressCountry: CONTACTO.pais,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: MAPA.latitud,
          longitude: MAPA.longitud,
        },
        hasMap: MAPA.enlace,
        areaServed: AREA_ATENDIDA,
        sameAs: perfiles(),
        // Aquí NO va `aggregateRating`. Una nota media que el propio negocio se
        // pone sobre sí mismo es exactamente lo que las directrices de datos
        // estructurados prohíben, y cuesta la elegibilidad de todo el bloque.
      },
      {
        '@type': 'WebSite',
        '@id': ID_SITIO,
        name: nombre,
        description: descripcion,
        url: `${SITIO}/`,
        // Las dos ramas del sitio, no solo la del idioma que se está pintando:
        // el nodo es el mismo `@id` en /es y en /en, y declararlo monolingüe en
        // cada rama sería contradecirse a sí mismo página a página.
        inLanguage: IDIOMAS.map(idioma => BCP47[idioma]),
        // Por `@id`: el editor ya está descrito arriba y repetir nombre,
        // teléfono y dirección aquí crearía una segunda entidad compitiendo con
        // la primera.
        publisher: { '@id': ID_NEGOCIO },
        // Aquí NO va `potentialAction: SearchAction`. El sitio no tiene buscador
        // interno, así que declararlo sería prometer una URL de resultados que
        // no existe.
      },
    ],
  }
}

/**
 * Una URL de imagen como la necesita un buscador: absoluta.
 *
 * Las fotos llegan por dos caminos. Las que sube el panel vienen de Cloudinary
 * y ya son absolutas; las del repositorio —los bodegones de /public— vienen
 * como `/images/cacao/…`. En Open Graph eso da igual porque `metadataBase`
 * las completa, pero dentro de un JSON-LD nadie las completa: una ruta
 * relativa en `image` es una imagen que el buscador no puede descargar, y sin
 * imagen descargable no hay resultado enriquecido de producto.
 */
export const urlAbsoluta = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `${SITIO}${url.startsWith('/') ? '' : '/'}${url}`

/**
 * El precio tal y como lo lee una máquina.
 *
 * `formatPrecio` —lo que se pinta en la ficha— da «$ 22.000», y ese mismo
 * texto dentro de `price` se interpreta como 22 con decimales: el punto es
 * separador decimal en schema.org, no de millares. Así que aquí NO se formatea
 * nada; sale el número crudo.
 *
 * Devuelve `null` cuando el valor no es un número utilizable —el backend puede
 * mandar la columna como cadena, o el producto puede venir sin precio— y quien
 * llama omite la oferta entera. Una oferta sin precio, o con precio 0, es peor
 * que ninguna: declara gratis algo que se cobra.
 */
const precioPlano = (valor: unknown): number | null => {
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Los dos estados de disponibilidad que el catálogo sabe distinguir. */
const EN_STOCK = 'https://schema.org/InStock'
const AGOTADO = 'https://schema.org/OutOfStock'

/**
 * La ficha de un producto de la tienda.
 *
 * Es el bloque que habilita el resultado enriquecido con precio y
 * disponibilidad, que en una SERP de producto es lo único que diferencia
 * visualmente un resultado de otro. Hasta ahora las fichas servían el precio y
 * el botón de compra en HTML y ni un solo dato estructurado: para el buscador
 * eran páginas de texto.
 *
 * El vendedor y la marca NO se describen aquí: van por `@id` contra la
 * `Organization` que el layout ya sirve en todas las páginas. El `name` de la
 * marca viaja junto al `@id` porque los validadores piden `brand.name` y
 * resolverlo entre dos bloques no está garantizado — es el mismo nombre, de la
 * misma clave de traducción, así que no crea una segunda entidad.
 *
 * Lo que falta a propósito: `gtin`/`mpn` —el catálogo no lleva códigos de
 * barras y un identificador inventado es peor que ninguno—, `priceValidUntil`
 * —no hay fecha de caducidad de precio—, y `shippingDetails` y
 * `hasMerchantReturnPolicy`, que el negocio todavía no ha definido. Google los
 * reclama como advertencia; ninguno es obligatorio y los cuatro serían
 * afirmaciones falsas.
 */
export function nodoProducto({
  producto,
  url,
  descripcion,
  imagenes,
  marca,
}: {
  producto: {
    id: string
    nombre: string
    precio: number
    stock: number
    categoria: string
  }
  /** La canónica de esta ficha en este idioma, absoluta. */
  url: string
  descripcion: string
  /** La galería, en el orden en que se muestra. La primera es la portada. */
  imagenes: string[]
  /** El nombre del negocio, que es también el de la marca. */
  marca: string
}) {
  const precio = precioPlano(producto.precio)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#producto`,
    url,
    name: producto.nombre,
    description: descripcion,
    ...(imagenes.length > 0 ? { image: imagenes.map(urlAbsoluta) } : {}),
    // El identificador del catálogo, no el slug: el slug cambia de idioma
    // —`chocolate-negro-70` y `dark-chocolate-70`— y un SKU que cambia con la
    // lengua convierte un producto en dos.
    sku: producto.id,
    category: producto.categoria,
    brand: { '@id': ID_NEGOCIO, name: marca },
    ...(precio
      ? {
          offers: {
            '@type': 'Offer',
            '@id': `${url}#oferta`,
            url,
            price: precio,
            priceCurrency: 'COP',
            availability: Number(producto.stock) > 0 ? EN_STOCK : AGOTADO,
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': ID_NEGOCIO },
          },
        }
      : {}),
  }
}

/**
 * La ficha de una experiencia.
 *
 * `TouristTrip` y NO `Event`. Un `Event` obliga a `startDate`, y aquí no hay
 * fechas fijas: las salidas son a demanda y se acuerdan al reservar. Poner una
 * fecha para satisfacer al validador sería inventarse el dato más importante
 * de la ficha, y además caducaría solo. Si algún día se abren salidas con fecha
 * cerrada, ese día se añade `Event` —no antes.
 *
 * `provider` va por `@id` contra la `Organization` del layout, por lo mismo que
 * en el producto: quien opera la salida ya está descrito una vez.
 *
 * La duración y la capacidad de la ficha se quedan fuera. `Trip` no tiene dónde
 * ponerlas —sus propiedades son itinerario, horarios de salida y llegada,
 * proveedor y ofertas— y `duracion` llega como texto libre («3 horas»), que no
 * es el ISO 8601 que pediría un campo de duración. Traducir «3 horas» a PT3H a
 * ojo desde el front es adivinar.
 */
export function nodoExperiencia({
  experiencia,
  url,
  urlReserva,
  descripcion,
  imagenes,
}: {
  experiencia: { nombre: string; precio: number }
  /** La canónica de la ficha en este idioma, absoluta. */
  url: string
  /** Dónde se reserva: es la URL de la oferta, no la de la ficha. */
  urlReserva: string
  descripcion: string
  imagenes: string[]
}) {
  const precio = precioPlano(experiencia.precio)

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${url}#experiencia`,
    url,
    name: experiencia.nombre,
    description: descripcion,
    ...(imagenes.length > 0 ? { image: imagenes.map(urlAbsoluta) } : {}),
    provider: { '@id': ID_NEGOCIO },
    ...(precio
      ? {
          offers: {
            '@type': 'Offer',
            '@id': `${url}#oferta`,
            url: urlReserva,
            price: precio,
            priceCurrency: 'COP',
            // Hay cupo mientras haya sitio en la salida, y la ficha se sirve
            // igual esté lleno o no: `InStock` es lo que afirma la página.
            availability: EN_STOCK,
            // El precio de la ficha es POR PERSONA, y un `price` suelto se lee
            // como el precio de la salida entera. `referenceQuantity` es lo que
            // lo dice: una unidad de `IE`, que en la lista de unidades de
            // UN/CEFACT —la que usa schema.org en `unitCode`— es «persona».
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: precio,
              priceCurrency: 'COP',
              referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'IE' },
            },
            seller: { '@id': ID_NEGOCIO },
          },
        }
      : {}),
  }
}

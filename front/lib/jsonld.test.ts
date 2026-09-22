import { describe, it, expect } from 'vitest'
import { grafoDelSitio, nodoProducto, nodoExperiencia, urlAbsoluta, ID_NEGOCIO, ID_SITIO } from './jsonld'
import { CONTACTO, MAPA, REDES } from './contacto'
import { SITIO } from './sitio'

const grafo = grafoDelSitio({ nombre: 'Vuelo Carmesí', descripcion: 'Una descripción' })
const nodos = grafo['@graph']
const negocio = nodos.find(n => n['@id'] === ID_NEGOCIO) as Record<string, unknown>
const sitio = nodos.find(n => n['@id'] === ID_SITIO) as Record<string, unknown>

describe('grafoDelSitio', () => {
  it('sale como JSON válido, que es lo único que el buscador llega a leer', () => {
    expect(() => JSON.parse(JSON.stringify(grafo))).not.toThrow()
  })

  it('declara el negocio como Organization y LocalBusiness a la vez', () => {
    expect(negocio['@type']).toEqual(['Organization', 'LocalBusiness'])
  })

  it('usa identificadores absolutos, que es lo que los hace estables entre páginas', () => {
    for (const id of [ID_NEGOCIO, ID_SITIO]) expect(id).toMatch(/^https:\/\/.+#/)
  })

  it('no repite los datos de contacto: salen de lib/contacto', () => {
    expect(negocio.telephone).toBe(CONTACTO.telefonoE164)
    expect(negocio.email).toBe(CONTACTO.email)
    expect(negocio.geo).toMatchObject({ latitude: MAPA.latitud, longitude: MAPA.longitud })
    expect(negocio.address).toMatchObject({
      addressLocality: CONTACTO.localidad,
      addressRegion: CONTACTO.region,
      addressCountry: CONTACTO.pais,
    })
  })

  it('el teléfono va en E.164, sin los espacios de la versión que se muestra', () => {
    expect(negocio.telephone).toMatch(/^\+\d+$/)
  })

  it('cobra en pesos', () => {
    expect(negocio.currenciesAccepted).toBe('COP')
  })

  it('descarta los perfiles sin URL en vez de declarar un enlace vacío', () => {
    expect(negocio.sameAs).toContain(REDES.instagram)
    expect(negocio.sameAs).not.toContain('')
  })

  it('el sitio nombra a su editor por @id y no lo describe otra vez', () => {
    expect(sitio.publisher).toEqual({ '@id': ID_NEGOCIO })
  })

  // Las dos reglas del encargo. Son las que más caro se pagan si alguien las
  // añade «porque Google las pide»: un buscador interno que no existe y una
  // nota media que el negocio se pone a sí mismo.
  it('no declara un buscador interno que el sitio no tiene', () => {
    expect(JSON.stringify(grafo)).not.toContain('SearchAction')
  })

  it('no se pone una nota media a sí mismo', () => {
    expect(JSON.stringify(grafo)).not.toContain('aggregateRating')
  })
})

const PRODUCTO = {
  id: 'p-7',
  nombre: 'Chocolate Aricao 100% x 125 gramos',
  precio: 22000,
  stock: 12,
  categoria: 'chocolates',
}

/**
 * El nodo tal y como acaba en la página: pasado por JSON.
 *
 * No es ceremonia. Lo que el buscador lee es la salida de JSON.stringify, y
 * serializar aquí es lo que hace que un `undefined` colado en un campo salte
 * en las aserciones en vez de pasar desapercibido.
 */
const producto = (extra: Partial<typeof PRODUCTO> = {}) =>
  JSON.parse(JSON.stringify(nodoProducto({
    producto: { ...PRODUCTO, ...extra },
    url: 'https://www.vuelocarmesi.com/tienda/chocolate-aricao-100-x-125-gramos',
    descripcion: 'Tableta de cacao fino de aroma.',
    imagenes: ['/images/cacao/bodegon-granos.jpg', 'https://res.cloudinary.com/x/foto.jpg'],
    marca: 'Vuelo Carmesí',
  })))

describe('nodoProducto', () => {
  it('es un Product con oferta, que es lo que habilita precio y stock en la SERP', () => {
    const p = producto()
    expect(p['@type']).toBe('Product')
    expect(p.offers['@type']).toBe('Offer')
  })

  it('el precio sale numérico y sin separadores de miles', () => {
    // El fallo que esto vigila: servir «$ 22.000», que schema.org lee como 22.
    expect(producto().offers.price).toBe(22000)
    expect(JSON.stringify(producto().offers.price)).toBe('22000')
  })

  it('cobra en pesos colombianos', () => {
    expect(producto().offers.priceCurrency).toBe('COP')
  })

  it('la disponibilidad sale del stock y no de una constante', () => {
    expect(producto({ stock: 12 }).offers.availability).toBe('https://schema.org/InStock')
    expect(producto({ stock: 0 }).offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('omite la oferta entera si no hay precio, en vez de declarar gratis lo que se cobra', () => {
    expect(producto({ precio: 0 }).offers).toBeUndefined()
    expect(producto({ precio: undefined as unknown as number }).offers).toBeUndefined()
  })

  it('acepta el precio que el backend mande como cadena', () => {
    expect(producto({ precio: '22000' as unknown as number }).offers.price).toBe(22000)
  })

  it('el vendedor y la marca van por @id y no describen al negocio otra vez', () => {
    const p = producto()
    expect(p.offers.seller).toEqual({ '@id': ID_NEGOCIO })
    expect(p.brand['@id']).toBe(ID_NEGOCIO)
    expect(p.brand.name).toBe('Vuelo Carmesí')
  })

  it('el SKU es el id del catálogo, que no cambia con el idioma', () => {
    expect(producto().sku).toBe('p-7')
  })

  it('las imágenes salen absolutas: una ruta relativa no se puede descargar', () => {
    for (const img of producto().image) expect(img).toMatch(/^https:\/\//)
    expect(producto().image).toContain('https://res.cloudinary.com/x/foto.jpg')
  })

  it('no inventa códigos de barras ni fechas de caducidad de precio', () => {
    const texto = JSON.stringify(producto())
    for (const campo of ['gtin', 'mpn', 'priceValidUntil', 'aggregateRating', 'review']) {
      expect(texto).not.toContain(campo)
    }
  })
})

const EXPERIENCIA = { nombre: 'AVISTAMIENTO DE AVES', precio: 95000 }

const experiencia = (extra: Partial<typeof EXPERIENCIA> = {}) =>
  JSON.parse(JSON.stringify(nodoExperiencia({
    experiencia: { ...EXPERIENCIA, ...extra },
    url: 'https://www.vuelocarmesi.com/experiencias/avistamiento-de-aves',
    urlReserva: 'https://www.vuelocarmesi.com/reservar/avistamiento-de-aves',
    descripcion: 'Salida guiada al amanecer.',
    imagenes: ['/images/aves/portada.jpg'],
  })))

describe('nodoExperiencia', () => {
  it('es un TouristTrip con su oferta en pesos', () => {
    const e = experiencia()
    expect(e['@type']).toBe('TouristTrip')
    expect(e.offers.price).toBe(95000)
    expect(e.offers.priceCurrency).toBe('COP')
  })

  // La regla del encargo. Un Event pide startDate, y aquí no hay fechas fijas:
  // ponerla sería inventarse el dato y además caducaría sola.
  it('no se declara como Event ni se inventa una fecha de salida', () => {
    const texto = JSON.stringify(experiencia())
    expect(texto).not.toContain('"Event"')
    expect(texto).not.toContain('startDate')
  })

  it('dice que el precio es por persona en vez de dejarlo como precio de la salida', () => {
    expect(experiencia().offers.priceSpecification.referenceQuantity).toMatchObject({
      value: 1,
      unitCode: 'IE',
    })
  })

  it('quien opera la salida va por @id', () => {
    expect(experiencia().provider).toEqual({ '@id': ID_NEGOCIO })
  })

  it('la oferta lleva a reservar, no de vuelta a la ficha', () => {
    const e = experiencia()
    expect(e.offers.url).toContain('/reservar/')
    expect(e.offers.url).not.toBe(e.url)
  })

  it('omite la oferta si la experiencia viene sin precio', () => {
    expect(experiencia({ precio: 0 }).offers).toBeUndefined()
  })
})

describe('urlAbsoluta', () => {
  it('completa las rutas del repositorio y deja intactas las de Cloudinary', () => {
    expect(urlAbsoluta('/images/a.jpg')).toBe(`${SITIO}/images/a.jpg`)
    expect(urlAbsoluta('images/a.jpg')).toBe(`${SITIO}/images/a.jpg`)
    const remota = 'https://res.cloudinary.com/demo/image/upload/a.jpg'
    expect(urlAbsoluta(remota)).toBe(remota)
  })
})

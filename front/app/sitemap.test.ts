import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * El sitemap se prueba con catálogo de mentira: lo que se verifica no es el
 * contenido de la base sino la forma de cada entrada —qué entra, qué no, y que
 * las dos lenguas se declaren entre sí—, que es lo que un despliegue no avisa
 * si se rompe. Un sitemap malo responde 200 igual.
 */
vi.mock('@/lib/api/experiencias', () => ({
  getExperiencias: async () => [
    { slug: 'experiencia-cacaotera', slugs: { es: 'experiencia-cacaotera', en: 'cacao-experience' } },
    // Ficha sin traducir: el inglés tiene que caer al slug español.
    { slug: 'avistamiento-de-aves', slugs: { es: 'avistamiento-de-aves' } },
  ],
}))

vi.mock('@/lib/api/productos', () => ({
  getProductos: async () => [
    { slug: 'nibs-de-cacao', slugs: { es: 'nibs-de-cacao', en: 'cacao-nibs' } },
  ],
}))

const { default: sitemap } = await import('./sitemap')

let urls: string[]
let entradas: Awaited<ReturnType<typeof sitemap>>

beforeEach(async () => {
  entradas = await sitemap()
  urls = entradas.map(e => e.url)
})

const SITIO = 'https://www.vuelocarmesi.com'

describe('sitemap.xml', () => {
  it('declara las páginas fijas en los dos idiomas', () => {
    // La portada va sin barra final: es como Next escribe su canónica.
    expect(urls).toContain(SITIO)
    expect(urls).not.toContain(`${SITIO}/`)

    for (const ruta of [
      '/aviturismo', '/sobre-nosotros', '/contacto', '/grupos',
      '/experiencias', '/tienda',
      '/politicas', '/politicas/cancelacion', '/politicas/proteccion-infancia',
      '/politicas/datos-personales', '/politicas/terminos-tienda',
      '/politicas/sostenibilidad',
    ]) {
      expect(urls, ruta).toContain(`${SITIO}${ruta}`)
    }

    for (const ruta of [
      '/en', '/en/birding', '/en/about', '/en/contact', '/en/group-visits',
      '/en/experiences', '/en/shop',
      '/en/policies', '/en/policies/cancellation', '/en/policies/child-protection',
      '/en/policies/personal-data', '/en/policies/shop-terms',
      '/en/policies/sustainability',
    ]) {
      expect(urls, ruta).toContain(`${SITIO}${ruta}`)
    }
  })

  it('deja fuera el embudo de compra, que es lo que robots.txt prohíbe', () => {
    // Si estas se colaran, Search Console reportaría «indexada pese a estar
    // bloqueada por robots.txt» para media docena de URLs sin contenido.
    for (const trozo of [
      '/carrito', '/checkout', '/reservar', '/admin',
      '/cart', '/book/', '/confirmation',
    ]) {
      expect(urls.filter(u => u.includes(trozo)), trozo).toEqual([])
    }
  })

  it('declara las fichas con el slug de cada idioma', () => {
    expect(urls).toContain(`${SITIO}/experiencias/experiencia-cacaotera`)
    expect(urls).toContain(`${SITIO}/en/experiences/cacao-experience`)
    expect(urls).toContain(`${SITIO}/tienda/nibs-de-cacao`)
    expect(urls).toContain(`${SITIO}/en/shop/cacao-nibs`)
  })

  it('una ficha sin traducir repite el slug español bajo /en', () => {
    // Es lo que hace la propia página en su canónica, y el backend resuelve el
    // slug original en los dos idiomas. Lo que no puede pasar es que la ficha
    // desaparezca del inglés.
    expect(urls).toContain(`${SITIO}/en/experiences/avistamiento-de-aves`)
  })

  it('cada entrada se lista a sí misma entre sus alternativas, con x-default', () => {
    for (const entrada of entradas) {
      const languages = entrada.alternates?.languages
      expect(languages, entrada.url).toBeDefined()
      expect(Object.values(languages!), entrada.url).toContain(entrada.url)
      expect(languages!['x-default'], entrada.url).toBe(languages!.es)
      expect(languages!.en, entrada.url).toBeDefined()
    }
  })

  it('todas las URLs son absolutas, con www y sin repetirse', () => {
    // El host importa: el ápex responde 301 y un sitemap de URLs que redirigen
    // es exactamente lo que Search Console marca como «URL no válida».
    for (const url of urls) {
      expect(url === SITIO || url.startsWith(`${SITIO}/`), url).toBe(true)
    }
    expect(new Set(urls).size, 'hay URLs duplicadas').toBe(urls.length)
  })
})

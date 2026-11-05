import { describe, it, expect, afterEach } from 'vitest'
import { destinoIdioma, recordarIdioma } from './destino-idioma'

const FICHA = { locale: 'es', slug: 'experiencia-cacaotera' }

describe('destinoIdioma', () => {
  it('va a la URL final en inglés, con el tramo de ruta traducido', () => {
    expect(
      destinoIdioma({ pathname: '/aviturismo', params: { locale: 'es' }, slugs: null, idioma: 'en' }),
    ).toBe('/en/birding')
  })

  it('va al español sin el prefijo /es, que redirige', () => {
    expect(
      destinoIdioma({ pathname: '/aviturismo', params: { locale: 'en' }, slugs: null, idioma: 'es' }),
    ).toBe('/aviturismo')
    expect(
      destinoIdioma({ pathname: '/', params: { locale: 'en' }, slugs: null, idioma: 'es' }),
    ).toBe('/')
  })

  it('usa el slug del idioma de destino en una ficha', () => {
    expect(
      destinoIdioma({
        pathname: '/experiencias/experiencia-cacaotera',
        params: FICHA,
        slugs: { es: 'experiencia-cacaotera', en: 'cacao-experience' },
        idioma: 'en',
      }),
    ).toBe('/en/experiences/cacao-experience')
  })

  it('no enlaza una ficha cuyos slugs aún no se conocen', () => {
    for (const pathname of ['/experiencias/experiencia-cacaotera', '/tienda/experiencia-cacaotera']) {
      expect(destinoIdioma({ pathname, params: FICHA, slugs: null, idioma: 'en' }), pathname).toBeNull()
    }
  })

  it('repite el slug en una ficha sin traducción', () => {
    expect(
      destinoIdioma({
        pathname: '/tienda/nibs-de-cacao',
        params: { locale: 'es', slug: 'nibs-de-cacao' },
        slugs: {},
        idioma: 'en',
      }),
    ).toBe('/en/shop/nibs-de-cacao')
  })

  it('no se queda sin enlace en las rutas que no publican slugs', () => {
    expect(
      destinoIdioma({
        pathname: '/reservar/experiencia-cacaotera',
        params: FICHA,
        slugs: null,
        idioma: 'en',
      }),
    ).toBe('/en/book/experiencia-cacaotera')
    expect(
      destinoIdioma({
        pathname: '/mi-pedido/abc123',
        params: { locale: 'es', token: 'abc123' },
        slugs: null,
        idioma: 'en',
      }),
    ).toBe('/en/my-order/abc123')
  })
})

describe('recordarIdioma', () => {
  afterEach(() => {
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
  })

  it('sobrescribe la cookie que lee el middleware', () => {
    document.cookie = 'NEXT_LOCALE=en; path=/'
    recordarIdioma('es')
    expect(document.cookie).toContain('NEXT_LOCALE=es')
    expect(document.cookie).not.toContain('NEXT_LOCALE=en')
  })
})

// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './routing'

const middleware = createMiddleware(routing)
const SITIO = 'https://www.vuelocarmesi.com'

const pedir = (ruta: string, cookie?: string) =>
  middleware(new NextRequest(`${SITIO}${ruta}`, { headers: cookie ? { cookie } : {} }))

describe('middleware de idioma', () => {
  it('no emite hreflang en la cabecera Link: repetiría el slug del idioma actual', () => {
    for (const ruta of ['/', '/en/birding', '/en/experiences/cacao-experience']) {
      expect(pedir(ruta).headers.get('link'), ruta).toBeNull()
    }
  })

  // La razón de que recordarIdioma() exista. Si next-intl cambia esto, el
  // selector de idioma deja de necesitar la cookie, o deja de funcionar.
  it('resuelve una URL sin prefijo según la cookie', () => {
    expect(pedir('/aviturismo', 'NEXT_LOCALE=en').headers.get('location')).toContain('/en/birding')
    expect(pedir('/aviturismo', 'NEXT_LOCALE=es').headers.get('location')).toBeNull()
  })
})

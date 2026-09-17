import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MATCHER_IDIOMA } from './matcher'

/**
 * Next compila el matcher como una ruta anclada; para probarlo basta anclarlo
 * igual y ver qué deja pasar.
 */
const pasa = (ruta: string) => new RegExp(`^${MATCHER_IDIOMA}$`).test(ruta)

describe('matcher del proxy de idioma', () => {
  it('deja pasar las rutas públicas en español', () => {
    for (const r of ['/', '/experiencias', '/tienda', '/sobre-nosotros', '/aviturismo', '/politicas']) {
      expect(pasa(r), r).toBe(true)
    }
  })

  it('deja pasar las rutas públicas en inglés', () => {
    for (const r of ['/en', '/en/experiences', '/en/shop', '/en/about', '/en/birding']) {
      expect(pasa(r), r).toBe(true)
    }
  })

  it('deja pasar las rutas de detalle con slug', () => {
    expect(pasa('/experiencias/experiencia-cacaotera')).toBe(true)
    expect(pasa('/en/experiences/cacao-experience')).toBe(true)
  })

  it('excluye el panel: reescribirlo a /es/admin lo haría desaparecer', () => {
    expect(pasa('/admin')).toBe(false)
    expect(pasa('/admin/login')).toBe(false)
    expect(pasa('/admin/experiencias')).toBe(false)
  })

  it('excluye la API y el portafolio estático', () => {
    expect(pasa('/api/admin/login')).toBe(false)
    expect(pasa('/portafolio')).toBe(false)
  })

  it('excluye los archivos con extensión', () => {
    // Esta es la que cazaría la regresión del backslash comido: con el patrón
    // roto (`.*..*`) estas daban false igual, pero también las de arriba.
    for (const r of ['/favicon.ico', '/images/marca/logo-crema.png', '/fonts/Bellota-Bold.ttf']) {
      expect(pasa(r), r).toBe(false)
    }
  })

  it('el patrón conserva el escape del punto', () => {
    // La prueba directa del bug: si el literal pierde la barra invertida, el
    // patrón contiene `.*..*` en vez de `.*\..*` y todo lo demás se cae.
    expect(MATCHER_IDIOMA).toContain('.*\\..*')
    expect(MATCHER_IDIOMA).not.toContain('|.*..*)')
  })

  it('proxy.ts lleva exactamente este patrón', () => {
    // Next exige que el matcher sea una cadena estática en el propio proxy.ts,
    // así que no se puede importar de aquí y hay dos copias por obligación.
    // Este test es lo que impide que se separen sin que nadie lo note: si
    // alguien edita una y no la otra, el sitio se cae entero y en silencio.
    // Ruta desde process.cwd(), que bajo vitest es front/. `import.meta.url`
    // no sirve acá: en el entorno jsdom no es una URL de esquema file.
    const fuente = readFileSync(resolve(process.cwd(), 'proxy.ts'), 'utf8')
    const encontrado = fuente.match(/matcher: \['(.+?)'\]/)
    expect(encontrado, 'no se encontró el matcher en proxy.ts').not.toBeNull()

    // El archivo trae el texto fuente (`\\.`); JS lo convierte en `\.` al
    // evaluarlo, que es lo que guarda MATCHER_IDIOMA. Se comparan en el mismo
    // plano deshaciendo ese escape.
    const enRuntime = encontrado![1].replace(/\\\\/g, '\\')
    expect(enRuntime).toBe(MATCHER_IDIOMA)
  })
})

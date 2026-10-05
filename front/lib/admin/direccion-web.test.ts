import { describe, it, expect } from 'vitest'
import { rutaPublica, vistaPreviaSlug } from './direccion-web'

describe('rutaPublica', () => {
  it('el español va sin prefijo de idioma', () => {
    expect(rutaPublica('experiencia', 'es', 'ruta-del-cacao')).toBe('/experiencias/ruta-del-cacao')
    expect(rutaPublica('producto', 'es', 'nibs-de-cacao')).toBe('/tienda/nibs-de-cacao')
  })

  it('el inglés lleva /en y el segmento traducido', () => {
    expect(rutaPublica('experiencia', 'en', 'cacao-trail')).toBe('/en/experiences/cacao-trail')
    expect(rutaPublica('producto', 'en', 'cacao-nibs')).toBe('/en/shop/cacao-nibs')
  })
})

describe('vistaPreviaSlug', () => {
  // Tiene que dar lo mismo que toSlug del backend: si no, el panel promete
  // una URL y se guarda otra.
  it('normaliza igual que el backend', () => {
    expect(vistaPreviaSlug('Ruta del Cacao')).toBe('ruta-del-cacao')
    expect(vistaPreviaSlug('  Café & Cacao — Señal 100% ')).toBe('cafe-cacao-senal-100')
    expect(vistaPreviaSlug('¿¿??')).toBe('')
  })
})

import { describe, it, expect } from 'vitest'
import { formatPrecio } from './format'

describe('formatPrecio', () => {
  it('en español usa $ y punto de millares', () => {
    expect(formatPrecio(160000)).toBe('$160.000')
    expect(formatPrecio(95000)).toBe('$95.000')
    expect(formatPrecio(1300000)).toBe('$1.300.000')
  })

  it('sin idioma se comporta como español: el panel no pasa ninguno', () => {
    expect(formatPrecio(160000)).toBe(formatPrecio(160000, 'es'))
  })

  it('en inglés antepone COP y usa coma de millares', () => {
    // Las dos mitades importan. «COP» porque un visitante estadounidense lee
    // «$160.000» como 160 dólares; la coma porque en inglés el punto es el
    // separador decimal y «160.000» se leería como ciento sesenta.
    expect(formatPrecio(160000, 'en')).toBe('COP 160,000')
    expect(formatPrecio(95000, 'en')).toBe('COP 95,000')
  })

  it('nunca muestra un importe convertido a dólares', () => {
    // El cobro es en pesos. Una cifra en USD sería un importe que el visitante
    // no va a pagar, porque la tasa se mueve y su banco añade spread.
    const en = formatPrecio(160000, 'en')
    expect(en).not.toMatch(/US\$|USD/)
    expect(en).toContain('160,000')
  })

  it('un idioma desconocido cae al español', () => {
    expect(formatPrecio(160000, 'de')).toBe('$160.000')
  })

  it('el cero y los importes pequeños se formatean igual', () => {
    expect(formatPrecio(0)).toBe('$0')
    expect(formatPrecio(0, 'en')).toBe('COP 0')
    expect(formatPrecio(500, 'en')).toBe('COP 500')
  })
})

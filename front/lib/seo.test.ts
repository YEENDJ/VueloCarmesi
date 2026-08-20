import { describe, it, expect } from 'vitest'
import { metaDescription, partirRelato, MAX_META } from './seo'

describe('metaDescription', () => {
  it('prefiere la escrita a mano', () => {
    expect(metaDescription('  A mano  ', 'El relato largo')).toBe('A mano')
  })

  it('deriva del relato cuando la corta está vacía', () => {
    expect(metaDescription('', 'Un relato corto.')).toBe('Un relato corto.')
    expect(metaDescription(undefined, 'Un relato corto.')).toBe('Un relato corto.')
  })

  it('devuelve cadena vacía si no hay ninguno de los dos', () => {
    expect(metaDescription('', '')).toBe('')
    expect(metaDescription(undefined, undefined)).toBe('')
  })

  it('colapsa los saltos de línea del relato', () => {
    expect(metaDescription('', 'Primera.\n\nSegunda.')).toBe('Primera. Segunda.')
  })

  it('cierra en un final de frase cuando cae en la parte alta del recorte', () => {
    const larga = 'Un primer tramo de relato que llena la mayor parte del cupo disponible sin problema y sigue. Y aquí arranca una segunda frase que ya no cabe entera.'
    const meta = metaDescription('', larga)
    expect(meta.length).toBeLessThanOrEqual(MAX_META)
    expect(meta.endsWith('.')).toBe(true)
    expect(meta.endsWith('…')).toBe(false)
  })

  // "espacio.…" se lee como un error tipográfico, no como una continuación.
  it('no pega puntos suspensivos detrás de un punto', () => {
    const larga = 'Frase uno que ocupa su espacio. ' + 'x'.repeat(200)
    const meta = metaDescription('', larga)
    expect(meta).toBe('Frase uno que ocupa su espacio.')
  })

  it('corta en palabra completa si no hay punto útil', () => {
    const larga = 'palabra '.repeat(60)
    const meta = metaDescription('', larga)
    expect(meta.length).toBeLessThanOrEqual(MAX_META + 1) // el carácter del puntos suspensivos
    expect(meta.endsWith('…')).toBe(true)
    expect(meta).not.toContain('palabr…') // nunca parte una palabra
  })
})

describe('partirRelato', () => {
  it('separa por párrafo, no por punto', () => {
    const { entradilla, resto } = partirRelato('Vive el cacao.\n\nY luego el resto del relato.')
    expect(entradilla).toBe('Vive el cacao.')
    expect(resto).toBe('Y luego el resto del relato.')
  })

  // Cortar por el primer punto rompía con abreviaturas y precios.
  it('no se rompe con abreviaturas ni precios', () => {
    const { entradilla, resto } = partirRelato('Salimos de la Cra. 5 con $1.500 en la mano y todo listo.')
    expect(entradilla).toBe('Salimos de la Cra. 5 con $1.500 en la mano y todo listo.')
    expect(resto).toBe('')
  })

  it('sin párrafos, todo va en la entradilla', () => {
    expect(partirRelato('Una sola línea sin puntos')).toEqual({
      entradilla: 'Una sola línea sin puntos',
      resto: '',
    })
  })

  it('tolera varios saltos y espacios entre párrafos', () => {
    const { entradilla, resto } = partirRelato('Uno\n   \n\nDos\n\nTres')
    expect(entradilla).toBe('Uno')
    expect(resto).toBe('Dos\n\nTres')
  })
})

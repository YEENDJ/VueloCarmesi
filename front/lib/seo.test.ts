import { describe, it, expect } from 'vitest'
import { metaDescription, parrafosRelato, MAX_META } from './seo'

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

describe('parrafosRelato', () => {
  it('separa por párrafo, no por punto', () => {
    expect(parrafosRelato('Vive el cacao.\n\nY luego el resto del relato.')).toEqual([
      'Vive el cacao.',
      'Y luego el resto del relato.',
    ])
  })

  // Cortar por el primer punto rompía con abreviaturas y precios.
  it('no se rompe con abreviaturas ni precios', () => {
    expect(parrafosRelato('Salimos de la Cra. 5 con $1.500 en la mano y todo listo.'))
      .toEqual(['Salimos de la Cra. 5 con $1.500 en la mano y todo listo.'])
  })

  // Un solo párrafo se muestra entero en la entradilla, sin cuerpo debajo.
  it('sin línea en blanco devuelve un solo párrafo', () => {
    expect(parrafosRelato('Una sola línea sin puntos')).toEqual(['Una sola línea sin puntos'])
  })

  it('tolera varios saltos y espacios entre párrafos', () => {
    expect(parrafosRelato('Uno\n   \n\nDos\n\nTres')).toEqual(['Uno', 'Dos', 'Tres'])
  })

  it('descarta el relato vacío', () => {
    expect(parrafosRelato('   \n\n  ')).toEqual([])
  })
})

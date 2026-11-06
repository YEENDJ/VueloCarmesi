import { describe, it, expect } from 'vitest'
import { componerRelato, problemaPrograma, relatoEditable, separarPrograma } from './programa'

describe('separarPrograma', () => {
  it('separa apertura, pasos y despedida con el formato del panel', () => {
    const r = separarPrograma([
      'Una apertura.',
      '1. Bienvenida\n- Recepción.\n- Introducción.',
      '2. Recorrido\n- Caminata guiada.',
      'CIERRE DE LA EXPERIENCIA\n- Agradecimiento.',
      'Una despedida.',
    ])
    expect(r.apertura).toEqual(['Una apertura.'])
    expect(r.despues).toEqual(['Una despedida.'])
    expect(r.pasos).toEqual([
      { numero: 1, titulo: 'Bienvenida', detalles: ['Recepción.', 'Introducción.'] },
      { numero: 2, titulo: 'Recorrido', detalles: ['Caminata guiada.'] },
      { numero: null, titulo: 'Cierre de la experiencia', detalles: ['Agradecimiento.'] },
    ])
  })

  it('reconoce los pasos que la traducción devuelve en una sola línea', () => {
    const r = separarPrograma([
      'An opening.',
      '1. Farm-Style Snack - Enjoy a snack. - A place to socialize.',
      'CONCLUSION OF THE EXPERIENCE - Thanks for visiting. - Time for photos.',
    ])
    expect(r.pasos).toEqual([
      { numero: 1, titulo: 'Farm-Style Snack', detalles: ['Enjoy a snack.', 'A place to socialize.'] },
      { numero: null, titulo: 'Conclusion of the experience', detalles: ['Thanks for visiting.', 'Time for photos.'] },
    ])
  })

  it('deja como relato un texto sin pasos', () => {
    const parrafos = ['Un párrafo normal.', 'Otro párrafo - con un inciso - entre guiones que no es un paso porque su inicio es larguísimo y sigue contando cosas sin parar.']
    expect(separarPrograma(parrafos)).toEqual({ apertura: parrafos, pasos: [], despues: [] })
  })

  it('no considera programa un solo paso', () => {
    const parrafos = ['Apertura.', 'Qué traer\n- Gorra.\n- Agua.']
    expect(separarPrograma(parrafos).pasos).toEqual([])
    expect(separarPrograma(parrafos).apertura).toEqual(parrafos)
  })

  it('deja todo como relato si hay un párrafo entre dos pasos', () => {
    const parrafos = ['1. Uno\n- A.', 'Texto en medio.', '2. Dos\n- B.']
    expect(separarPrograma(parrafos)).toEqual({ apertura: parrafos, pasos: [], despues: [] })
  })

  it('no acepta líneas sin viñeta debajo del título', () => {
    const parrafos = ['Título\nUna línea suelta.', 'Otro\nOtra línea.']
    expect(separarPrograma(parrafos).pasos).toEqual([])
  })

  it('tolera un relato vacío', () => {
    expect(separarPrograma([])).toEqual({ apertura: [], pasos: [], despues: [] })
  })

  it('reconoce pasos aplanados de un solo detalle', () => {
    const r = separarPrograma(['1. Snack - Enjoy a snack.', '2. Walk - A guided walk.', 'Closing - Thanks for visiting.'])
    expect(r.pasos).toEqual([
      { numero: 1, titulo: 'Snack', detalles: ['Enjoy a snack.'] },
      { numero: 2, titulo: 'Walk', detalles: ['A guided walk.'] },
      { numero: null, titulo: 'Closing', detalles: ['Thanks for visiting.'] },
    ])
  })

  it('no toma por paso una frase con inciso si no sigue a otro paso', () => {
    const parrafos = ['Una finca - con historia.', '1. Uno\n- A.', '2. Dos\n- B.']
    const r = separarPrograma(parrafos)
    expect(r.apertura).toEqual(['Una finca - con historia.'])
    expect(r.pasos).toHaveLength(2)
  })
})

describe('componerRelato', () => {
  const relato = {
    apertura: 'Una apertura.',
    pasos: [
      { numero: 1, titulo: 'Bienvenida', detalles: ['Recepción.', 'Introducción.'] },
      { numero: 2, titulo: 'Recorrido', detalles: ['Caminata.'] },
      { numero: null, titulo: 'Cierre', detalles: ['Agradecimiento.'] },
    ],
    despues: 'Una despedida.',
  }

  it('arma el formato que lee la ficha', () => {
    expect(componerRelato(relato)).toBe(
      'Una apertura.\n\n1. Bienvenida\n- Recepción.\n- Introducción.\n\n2. Recorrido\n- Caminata.\n\nCierre\n- Agradecimiento.\n\nUna despedida.',
    )
  })

  it('lo que compone se vuelve a abrir igual', () => {
    expect(relatoEditable(componerRelato(relato))).toEqual(relato)
  })

  it('renumera según el orden y conserva los pasos sin número', () => {
    const texto = componerRelato({
      apertura: '',
      despues: '',
      pasos: [
        { numero: 7, titulo: 'Dos', detalles: ['B'] },
        { numero: null, titulo: 'Pausa', detalles: ['C'] },
        { numero: 3, titulo: 'Uno', detalles: ['A'] },
      ],
    })
    expect(texto).toBe('1. Dos\n- B\n\nPausa\n- C\n\n2. Uno\n- A')
  })

  it('limpia lo que se escribió a mano por costumbre', () => {
    const texto = componerRelato({
      apertura: '  Hola.  ',
      despues: '',
      pasos: [
        { numero: 1, titulo: ' 1. Bienvenida ', detalles: ['- Recepción', '   ', '• Saludo'] },
        { numero: 2, titulo: 'Fin', detalles: ['Adiós'] },
      ],
    })
    expect(texto).toBe('Hola.\n\n1. Bienvenida\n- Recepción\n- Saludo\n\n2. Fin\n- Adiós')
  })

  it('deja un relato sin programa como estaba', () => {
    const texto = 'Primer párrafo.\n\nSegundo párrafo.'
    expect(componerRelato(relatoEditable(texto))).toBe(texto)
  })
})

describe('problemaPrograma', () => {
  const bien = { numero: 1, titulo: 'Uno', detalles: ['A'] }

  it('acepta no tener programa, o tener uno completo', () => {
    expect(problemaPrograma([])).toBeNull()
    expect(problemaPrograma([bien, { ...bien, numero: null, titulo: 'Dos' }])).toBeNull()
  })

  it('pide al menos dos pasos', () => {
    expect(problemaPrograma([bien])).toMatch(/dos pasos/)
  })

  it('señala el paso incompleto', () => {
    expect(problemaPrograma([bien, { ...bien, titulo: ' ' }])).toMatch(/paso 2/)
    expect(problemaPrograma([bien, { ...bien, detalles: ['  '] }])).toMatch(/paso 2/)
  })
})

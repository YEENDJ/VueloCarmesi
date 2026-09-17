import { camposACambiar, camposDesactualizados, huellasDe, huellaDe } from './campos'

const CAMPOS = ['nombre', 'descripcionLarga'] as const
const LISTAS = ['incluye'] as const
const TODOS = [...CAMPOS, ...LISTAS]

const FICHA = {
  nombre: 'Ruta del Cacao',
  descripcionLarga: 'Caminamos entre cacao en sombrío.',
  incluye: ['Guía', 'Refrigerio'],
}

/** Una traducción coherente con FICHA, como la dejaría un guardado anterior. */
const TRADUCIDA = {
  nombre: 'Cacao Trail',
  descripcionLarga: 'We walk through shade-grown cacao.',
  incluye: ['Guide', 'Refreshments'],
}

describe('camposACambiar', () => {
  it('pide traducir todo cuando no hay traducción previa', () => {
    expect(camposACambiar(FICHA, TODOS, {}, null)).toEqual(TODOS)
  })

  it('no pide nada cuando el español no cambió — el guardado no sale a la red', () => {
    const huellas = huellasDe(FICHA, TODOS)
    expect(camposACambiar(FICHA, TODOS, huellas, TRADUCIDA)).toEqual([])
  })

  it('pide solo el campo que cambió', () => {
    const huellas = huellasDe(FICHA, TODOS)
    const editada = { ...FICHA, nombre: 'Ruta del Cacao y las Aves' }
    expect(camposACambiar(editada, TODOS, huellas, TRADUCIDA)).toEqual(['nombre'])
  })

  it('detecta el cambio dentro de una lista', () => {
    const huellas = huellasDe(FICHA, TODOS)
    const editada = { ...FICHA, incluye: ['Guía', 'Refrigerio', 'Transporte'] }
    expect(camposACambiar(editada, TODOS, huellas, TRADUCIDA)).toEqual(['incluye'])
  })

  it('no pisa lo que revisó un humano aunque el español haya cambiado', () => {
    const huellas = huellasDe(FICHA, TODOS)
    const editada = { ...FICHA, nombre: 'Otro nombre' }
    const pendientes = camposACambiar(editada, TODOS, huellas, TRADUCIDA, { nombre: true })
    expect(pendientes).toEqual([])
  })

  it('retraduce si la traducción se perdió, aunque la huella coincida', () => {
    const huellas = huellasDe(FICHA, TODOS)
    const rota = { ...TRADUCIDA, nombre: '' }
    expect(camposACambiar(FICHA, TODOS, huellas, rota)).toEqual(['nombre'])
  })

  it('ignora los campos vacíos en español: no se paga por traducir nada', () => {
    const parcial = { ...FICHA, descripcionLarga: '   ', incluye: [] }
    expect(camposACambiar(parcial, TODOS, {}, null)).toEqual(['nombre'])
  })
})

describe('camposDesactualizados', () => {
  it('marca lo revisado por un humano cuyo original cambió', () => {
    const huellas = huellasDe(FICHA, TODOS)
    const editada = { ...FICHA, nombre: 'Otro nombre' }
    expect(camposDesactualizados(editada, TODOS, huellas, { nombre: true })).toEqual(['nombre'])
  })

  it('no marca nada si lo revisado sigue coincidiendo', () => {
    const huellas = huellasDe(FICHA, TODOS)
    expect(camposDesactualizados(FICHA, TODOS, huellas, { nombre: true })).toEqual([])
  })
})

describe('huellaDe', () => {
  it('distingue una lista de su concatenación', () => {
    // Sin separador propio, ['a b'] y ['a','b'] darían la misma huella y un
    // cambio de viñetas pasaría desapercibido.
    expect(huellaDe(['a b'])).not.toBe(huellaDe(['a', 'b']))
  })

  it('trata null, undefined y cadena vacía como lo mismo', () => {
    expect(huellaDe(null)).toBe(huellaDe(''))
    expect(huellaDe(undefined)).toBe(huellaDe(''))
  })
})

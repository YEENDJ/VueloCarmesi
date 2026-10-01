import { describe, it, expect } from 'vitest'
import { disponiblesPrimero } from './orden-productos'

const p = (id: string, stock: number) => ({ id, stock })

describe('disponiblesPrimero', () => {
  it('manda los agotados al final', () => {
    const orden = disponiblesPrimero([p('a', 0), p('b', 3), p('c', 0), p('d', 1)]).map(x => x.id)
    expect(orden).toEqual(['b', 'd', 'a', 'c'])
  })

  it('respeta el orden original dentro de cada grupo', () => {
    const orden = disponiblesPrimero([p('nuevo', 5), p('viejo', 9), p('agotado-nuevo', 0), p('agotado-viejo', 0)])
      .map(x => x.id)
    expect(orden).toEqual(['nuevo', 'viejo', 'agotado-nuevo', 'agotado-viejo'])
  })

  it('no modifica la lista que recibe', () => {
    const lista = [p('a', 0), p('b', 1)]
    disponiblesPrimero(lista)
    expect(lista.map(x => x.id)).toEqual(['a', 'b'])
  })
})

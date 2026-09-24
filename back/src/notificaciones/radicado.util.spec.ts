import { fechaHoraRecibido, radicado } from './radicado.util'

describe('radicado', () => {
  it('usa el día en hora de Colombia y el final del id', () => {
    expect(radicado('cmabcdef4f7k2q', new Date('2026-09-24T15:32:00Z'))).toBe('VC-20260924-4F7K2Q')
  })

  it('a las 11 p. m. de Colombia sigue siendo ese día, aunque en UTC ya sea el siguiente', () => {
    expect(radicado('cmabcdef4f7k2q', new Date('2026-09-25T04:00:00Z'))).toBe('VC-20260924-4F7K2Q')
  })

  it('pone fecha y hora de recepción en hora de Colombia', () => {
    const texto = fechaHoraRecibido(new Date('2026-09-24T15:32:00Z'))
    expect(texto).toContain('24 de septiembre de 2026')
    expect(texto).toContain('10:32')
  })
})

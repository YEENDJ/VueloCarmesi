import { describe, it, expect } from 'vitest'
import { radicado } from './radicado'

// Mismos casos que back/src/notificaciones/radicado.util.spec.ts: los dos
// gemelos tienen que dar el mismo número.
describe('radicado', () => {
  it('usa el día en hora de Colombia y el final del id', () => {
    expect(radicado('cmabcdef4f7k2q', '2026-09-24T15:32:00Z')).toBe('VC-20260924-4F7K2Q')
  })

  it('a las 11 p. m. de Colombia sigue siendo ese día, aunque en UTC ya sea el siguiente', () => {
    expect(radicado('cmabcdef4f7k2q', '2026-09-25T04:00:00Z')).toBe('VC-20260924-4F7K2Q')
  })
})

import { fechasAlPasarA } from './fechas-estado'

const ahora = new Date('2026-10-21T15:00:00Z')
const antes = new Date('2026-10-20T10:00:00Z')

describe('fechas del avance', () => {
  it('al pasar a un paso guarda su hora y borra las de los pasos siguientes', () => {
    expect(fechasAlPasarA('enviado', {}, ahora)).toEqual({ enviadoEn: ahora, entregadoEn: null })
  })

  it('una corrección hacia atrás conserva la hora del paso al que vuelve', () => {
    expect(fechasAlPasarA('pagado', { pagadoEn: antes, enviadoEn: ahora }, ahora))
      .toEqual({ pagadoEn: antes, enviadoEn: null, entregadoEn: null })
  })

  it('cancelado, expirado y revisión no tocan las fechas', () => {
    expect(fechasAlPasarA('cancelado', { pagadoEn: antes }, ahora)).toEqual({})
    expect(fechasAlPasarA('requiere_revision', {}, ahora)).toEqual({})
  })
})

import {
  hoyBogota, fechaMinimaReserva, fechaMaximaReserva, fechaReservaValida, sumarDias,
} from './fecha-reserva.util'

describe('fecha-reserva.util', () => {
  beforeEach(() => {
    // Mediodía en Bogotá (UTC-5) para evitar ambigüedad de zona
    jest.useFakeTimers().setSystemTime(new Date('2026-07-04T12:00:00-05:00'))
  })
  afterEach(() => jest.useRealTimers())

  it('hoyBogota devuelve la fecha de Bogotá en formato ISO', () => {
    expect(hoyBogota()).toBe('2026-07-04')
  })

  it('la fecha mínima es mañana', () => {
    expect(fechaMinimaReserva()).toBe('2026-07-05')
  })

  it('la fecha máxima es hoy + 6 meses', () => {
    expect(fechaMaximaReserva()).toBe('2027-01-04')
  })

  it('usa el día de Bogotá aunque UTC ya esté en el día siguiente', () => {
    // 23:00 en Bogotá = 04:00 UTC del día siguiente
    jest.setSystemTime(new Date('2026-07-04T23:00:00-05:00'))
    expect(hoyBogota()).toBe('2026-07-04')
    expect(fechaMinimaReserva()).toBe('2026-07-05')
  })

  it('valida los límites del rango de forma inclusiva', () => {
    expect(fechaReservaValida('2026-07-04')).toBe(false) // hoy: no
    expect(fechaReservaValida('2026-07-05')).toBe(true)  // mañana: sí
    expect(fechaReservaValida('2027-01-04')).toBe(true)  // límite superior: sí
    expect(fechaReservaValida('2027-01-05')).toBe(false) // pasado el límite: no
    expect(fechaReservaValida('2026-01-01')).toBe(false) // pasado: no
  })

  it('acepta fecha ISO con hora y compara solo el día', () => {
    expect(fechaReservaValida('2026-07-05T10:00:00.000Z')).toBe(true)
  })

  it('sumarDias cruza fin de mes correctamente', () => {
    expect(sumarDias('2026-07-31', 1)).toBe('2026-08-01')
  })
})

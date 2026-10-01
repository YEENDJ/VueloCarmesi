import { calcularAbono, leerPorcentajeAbono, porcentajeAbonoValido } from './abono'

describe('porcentaje de abono', () => {
  it.each(['1', '30', '100', ' 45 '])('acepta %p', v => expect(porcentajeAbonoValido(v)).toBe(true))

  // Cada uno de estos, guardado a ciegas, haría que la reserva cobrara cero o de más.
  it.each(['0', '101', '30%', '30.5', 'treinta', '', '-5', '1000'])('rechaza %p', v =>
    expect(porcentajeAbonoValido(v)).toBe(false))

  it('sin clave usa el 30 sin marcarlo como error', () => {
    expect(leerPorcentajeAbono(undefined)).toEqual({ porcentaje: 30, valido: true })
    expect(leerPorcentajeAbono('')).toEqual({ porcentaje: 30, valido: true })
  })

  it('con un valor dañado usa el 30 y lo marca', () => {
    expect(leerPorcentajeAbono('30%')).toEqual({ porcentaje: 30, valido: false })
  })

  it('calcula en pesos enteros y el saldo cuadra exacto', () => {
    const total = 95000 * 3
    const abono = calcularAbono(total, 30)
    expect(abono).toBe(85500)
    expect(Number.isInteger(calcularAbono(33333, 30))).toBe(true)
    expect(total - abono).toBe(199500)
  })
})

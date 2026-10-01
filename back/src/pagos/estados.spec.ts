import { puedeTransicionar, tienePagoEnCurso } from './estados'

describe('transiciones de un pago', () => {
  it.each([
    ['pendiente', 'aprobado'], ['pendiente', 'rechazado'], ['pendiente', 'expirado'],
    ['expirado', 'aprobado'], ['aprobado', 'anulado'], ['error', 'aprobado'],
    ['rechazado', 'aprobado'],
  ])('permite %s → %s', (d, h) => expect(puedeTransicionar(d, h)).toBe(true))

  it.each([
    ['aprobado', 'rechazado'], ['aprobado', 'pendiente'], ['rechazado', 'anulado'],
    ['rechazado', 'pendiente'],
    ['anulado', 'aprobado'], ['aprobado', 'expirado'], ['desconocido', 'aprobado'],
  ])('no permite %s → %s', (d, h) => expect(puedeTransicionar(d, h)).toBe(false))
})

describe('tienePagoEnCurso', () => {
  const ahora = new Date('2026-10-01T12:00:00Z')
  const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000)

  it('un pendiente que la pasarela ya tiene, dentro del tope, cuenta', () => {
    expect(tienePagoEnCurso([{ estado: 'pendiente', proveedorTxId: 'tx', createdAt: hace(2) }], ahora)).toBe(true)
  })

  it('uno sin transacción es un abandono y no cuenta', () => {
    expect(tienePagoEnCurso([{ estado: 'pendiente', proveedorTxId: null, createdAt: hace(1) }], ahora)).toBe(false)
  })

  it('pasado el tope de 24 horas deja de contar', () => {
    expect(tienePagoEnCurso([{ estado: 'pendiente', proveedorTxId: 'tx', createdAt: hace(25) }], ahora)).toBe(false)
  })
})

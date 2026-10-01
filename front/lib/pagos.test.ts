import { describe, expect, it } from 'vitest'
import { calcularAbono, vistaDe, type EstadoPublico } from './pagos'

const AHORA = new Date('2026-10-01T15:00:00Z')

const estado = (e: Partial<EstadoPublico>): EstadoPublico => ({
  referencia: 'VC-P-ABC-1', estado: 'pendiente', monto: 100000, motivo: null, tipo: 'pedido',
  estadoDueno: 'pendiente_pago', venceEn: '2026-10-01T15:30:00Z', total: 100000, codigo: 'VC-ABC123',
  ...e,
})

describe('vistaDe', () => {
  it('aprobado y pedido pagado: éxito', () => {
    expect(vistaDe(estado({ estado: 'aprobado', estadoDueno: 'pagado' }), AHORA)).toBe('aprobado')
  })

  it('reserva con abono aprobado queda pendiente de confirmar, y eso es éxito', () => {
    expect(vistaDe(estado({ tipo: 'reserva', estado: 'aprobado', estadoDueno: 'pendiente' }), AHORA)).toBe('aprobado')
  })

  it('el banco no ha respondido: pendiente', () => {
    expect(vistaDe(estado({}), AHORA)).toBe('pendiente')
  })

  it('rechazado y todavía a tiempo: se ofrece reintentar', () => {
    expect(vistaDe(estado({ estado: 'rechazado' }), AHORA)).toBe('rechazado')
  })

  it('rechazado pero ya pasó el plazo: vencido, no se ofrece reintentar', () => {
    expect(vistaDe(estado({ estado: 'rechazado', venceEn: '2026-10-01T14:00:00Z' }), AHORA)).toBe('vencido')
  })

  it('el pedido venció', () => {
    expect(vistaDe(estado({ estado: 'expirado', estadoDueno: 'expirado' }), AHORA)).toBe('vencido')
  })

  // Dos pestañas: este intento se rechazó, el otro se aprobó. El cliente ya pagó.
  it('manda el pedido, no el intento: si otro intento lo pagó, es éxito', () => {
    expect(vistaDe(estado({ estado: 'rechazado', estadoDueno: 'pagado' }), AHORA)).toBe('aprobado')
  })

  it('en revisión o anulado: se le dice que lo contactan', () => {
    expect(vistaDe(estado({ estado: 'aprobado', estadoDueno: 'requiere_revision' }), AHORA)).toBe('revision')
    expect(vistaDe(estado({ estado: 'anulado', estadoDueno: 'pagado' }), AHORA)).toBe('revision')
  })
})

describe('calcularAbono', () => {
  // Gemelo de back/src/pagos/abono.ts: mismas entradas, misma cifra.
  it('da lo mismo que el backend', () => {
    expect(calcularAbono(285000, 30)).toBe(85500)
    expect(calcularAbono(190000, 40)).toBe(76000)
    expect(calcularAbono(33333, 30)).toBe(10000)
  })
})

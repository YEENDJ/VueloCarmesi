import { describe, it, expect } from 'vitest'
import { cuentaEnCifras, cuentaEnIngresos, esDePrueba, nombreMetodo, requiereRevision, tienePagoAprobado } from './pagos'
import type { AdminPago } from './types'

const pago = (modo: string, estado = 'aprobado'): AdminPago => ({
  id: 'p', referencia: 'VC-P-1', monto: 1000, estado, metodo: 'pse', motivo: null,
  modo, proveedor: 'wompi', createdAt: '2026-10-01T00:00:00Z',
})

describe('esDePrueba', () => {
  it('un pedido sin pagos es del flujo manual: real', () => {
    expect(esDePrueba({ estado: 'pendiente' })).toBe(false)
    expect(esDePrueba({ estado: 'pendiente', pagos: [] })).toBe(false)
  })

  it('todos sus intentos del sandbox: de prueba', () => {
    expect(esDePrueba({ estado: 'pagado', pagos: [pago('prueba'), pago('prueba', 'rechazado')] })).toBe(true)
  })

  it('con un solo intento real ya no es de prueba', () => {
    expect(esDePrueba({ estado: 'pagado', pagos: [pago('prueba'), pago('produccion')] })).toBe(false)
  })
})

describe('cuentaEnCifras', () => {
  it('no cuenta lo que esperó pago y no lo tuvo', () => {
    expect(cuentaEnCifras({ estado: 'pendiente_pago' })).toBe(false)
    expect(cuentaEnCifras({ estado: 'expirado' })).toBe(false)
    expect(cuentaEnCifras({ estado: 'expirada' })).toBe(false)
  })

  it('no cuenta los de prueba', () => {
    expect(cuentaEnCifras({ estado: 'pagado', pagos: [pago('prueba')] })).toBe(false)
  })

  it('cuenta los reales, también los del flujo manual y los cancelados', () => {
    expect(cuentaEnCifras({ estado: 'pagado', pagos: [pago('produccion')] })).toBe(true)
    expect(cuentaEnCifras({ estado: 'pendiente' })).toBe(true)
    expect(cuentaEnCifras({ estado: 'cancelado' })).toBe(true)
  })
})

describe('cuentaEnIngresos', () => {
  it('un cancelado se cuenta como pedido pero no como ingreso', () => {
    expect(cuentaEnIngresos({ estado: 'cancelado' })).toBe(false)
    expect(cuentaEnIngresos({ estado: 'cancelada' })).toBe(false)
  })

  it('un pagado real es ingreso', () => {
    expect(cuentaEnIngresos({ estado: 'pagado', pagos: [pago('produccion')] })).toBe(true)
  })
})

describe('requiereRevision y nombreMetodo', () => {
  it('solo requiere_revision va a la bandeja', () => {
    expect(requiereRevision({ estado: 'requiere_revision' })).toBe(true)
    expect(requiereRevision({ estado: 'pendiente' })).toBe(false)
  })

  it('traduce los métodos conocidos y deja pasar los desconocidos', () => {
    expect(nombreMetodo('PSE')).toBe('PSE')
    expect(nombreMetodo('card')).toBe('Tarjeta')
    expect(nombreMetodo('daviplata')).toBe('daviplata')
    expect(nombreMetodo(null)).toBe('—')
  })
})

describe('tienePagoAprobado', () => {
  it('una reserva pendiente con el abono cobrado se marca como pagada', () => {
    expect(tienePagoAprobado({ estado: 'pendiente', pagos: [pago('prueba', 'rechazado'), pago('prueba')] })).toBe(true)
  })

  it('sin pagos, o solo con intentos fallidos o anulados, no', () => {
    expect(tienePagoAprobado({ estado: 'pendiente' })).toBe(false)
    expect(tienePagoAprobado({ estado: 'pendiente_pago', pagos: [pago('prueba', 'rechazado')] })).toBe(false)
    expect(tienePagoAprobado({ estado: 'requiere_revision', pagos: [pago('produccion', 'anulado')] })).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import * as panel from './transiciones'
// La que decide. Es TypeScript puro, sin Nest ni Prisma: se puede importar aquí.
import * as backend from '../../../back/src/common/transiciones-estado'

const ESTADOS = {
  pedido: ['pendiente', 'pendiente_pago', 'requiere_revision', 'pagado', 'enviado', 'entregado', 'cancelado', 'expirado'],
  reserva: ['pendiente', 'pendiente_pago', 'requiere_revision', 'confirmada', 'cancelada', 'expirada'],
} as const
const CONTEXTOS = [false, true].flatMap(pagoEnCurso => [false, true].map(fechaPasada => ({ pagoEnCurso, fechaPasada })))

describe('la tabla del panel es gemela de la del backend', () => {
  for (const tipo of ['pedido', 'reserva'] as const) {
    it(`${tipo}: mismas opciones y mismos bloqueos en cada estado`, () => {
      for (const estado of ESTADOS[tipo]) {
        for (const c of CONTEXTOS) {
          expect(panel.opcionesEstado(tipo, estado, c), `${tipo} ${estado} ${JSON.stringify(c)}`)
            .toEqual(backend.opcionesEstado(tipo, estado, c))
        }
      }
    })
  }

  it('mismas etiquetas', () => {
    expect(panel.ETIQUETA_ESTADO).toEqual(backend.ETIQUETA_ESTADO)
  })
})

describe('pago en curso', () => {
  const ahora = new Date('2026-10-20T12:00:00Z')
  const pago = (estado: string, proveedorTxId: string | null, horasAtras: number) => ({
    id: 'p', referencia: 'r', monto: 1, estado, metodo: null, motivo: null, modo: 'prueba', proveedor: 'wompi',
    proveedorTxId, createdAt: new Date(ahora.getTime() - horasAtras * 3_600_000).toISOString(),
  })

  it('cuenta solo si el banco tiene la transacción y no ha pasado el tope', () => {
    expect(panel.tienePagoEnCurso([pago('pendiente', 'tx', 1)], ahora)).toBe(true)
    // Abrió la pasarela y la cerró: no bloquea marcar pagado a mano.
    expect(panel.tienePagoEnCurso([pago('pendiente', null, 1)], ahora)).toBe(false)
    expect(panel.tienePagoEnCurso([pago('pendiente', 'tx', 25)], ahora)).toBe(false)
    expect(panel.tienePagoEnCurso([pago('rechazado', 'tx', 1)], ahora)).toBe(false)
  })
})

describe('deshacer', () => {
  it('solo los cambios que tienen corrección', () => {
    expect(panel.sePuedeDeshacer('pedido', 'pagado', 'enviado')).toBe(true)
    expect(panel.sePuedeDeshacer('pedido', 'enviado', 'entregado')).toBe(true)
    // Cancelar ya devolvió el stock; deshacer la corrección no ofrece otra vuelta.
    expect(panel.sePuedeDeshacer('pedido', 'pagado', 'cancelado')).toBe(false)
    expect(panel.sePuedeDeshacer('pedido', 'enviado', 'pagado')).toBe(false)
  })
})

describe('confirmaciones', () => {
  it('pregunta antes de cancelar, de marcar pagado a mano y de corregir', () => {
    expect(panel.confirmacionPedido('pagado', 'cancelado')?.boton).toBe('Cancelar pedido')
    expect(panel.confirmacionPedido('pendiente_pago', 'pagado')?.mensaje).toContain('por fuera de la pasarela')
    expect(panel.confirmacionPedido('enviado', 'pagado')?.titulo).toBe('Corregir el estado')
    expect(panel.confirmacionPedido('pagado', 'enviado')).toBeNull()
  })
})

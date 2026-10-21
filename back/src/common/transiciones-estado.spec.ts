import { opcionesEstado, motivoRechazoCambio } from './transiciones-estado'

const libre = { pagoEnCurso: false, fechaPasada: false }
const destinos = (tipo: 'pedido' | 'reserva', estado: string) =>
  opcionesEstado(tipo, estado, libre).map(o => `${o.destino}${o.tipo === 'correccion' ? '↩' : ''}`)

describe('orden de estados de un pedido', () => {
  it('avanza pagado → enviado → entregado', () => {
    expect(destinos('pedido', 'pendiente')).toEqual(['pagado', 'cancelado'])
    expect(destinos('pedido', 'pagado')).toEqual(['enviado', 'cancelado'])
    expect(destinos('pedido', 'enviado')).toEqual(['entregado', 'pagado↩'])
  })

  it('entregado solo admite la corrección, y los finales nada', () => {
    expect(destinos('pedido', 'entregado')).toEqual(['enviado↩'])
    expect(destinos('pedido', 'cancelado')).toEqual([])
    expect(destinos('pedido', 'expirado')).toEqual([])
  })

  it('con un pago en curso, esperando pago no se marca pagado ni se cancela', () => {
    const opciones = opcionesEstado('pedido', 'pendiente_pago', { ...libre, pagoEnCurso: true })
    expect(opciones.every(o => o.bloqueo?.includes('pago en curso'))).toBe(true)
  })
})

describe('orden de estados de una reserva', () => {
  it('confirmada no vuelve a pendiente', () => {
    expect(destinos('reserva', 'confirmada')).toEqual(['cancelada'])
  })

  it('con la fecha pasada no se confirma, y una confirmada ya realizada no se cancela', () => {
    const pasada = { ...libre, fechaPasada: true }
    expect(motivoRechazoCambio('reserva', 'pendiente', 'confirmada', pasada)).toContain('ya pasó')
    expect(motivoRechazoCambio('reserva', 'confirmada', 'cancelada', pasada)).toContain('ya se realizó')
    // Una pendiente vieja sí se puede cancelar: es limpiar.
    expect(motivoRechazoCambio('reserva', 'pendiente', 'cancelada', pasada)).toBeNull()
  })
})

it('el motivo de un cambio fuera de la tabla nombra los dos estados', () => {
  expect(motivoRechazoCambio('pedido', 'cancelado', 'pagado', libre))
    .toBe('El pedido está «Cancelado» y no puede pasar a «Pagado»')
})

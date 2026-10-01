import { formatDireccionPedido } from './format-direccion.util'

describe('formatDireccionPedido', () => {
  it('concatena dirección, ciudad y código postal', () => {
    const resultado = formatDireccionPedido({
      direccion: 'Calle 10 # 5-30', ciudad: 'Medellín', codigoPostal: '050001',
    })
    expect(resultado).toBe('Calle 10 # 5-30, Medellín (CP 050001)')
  })

  it('omite el código postal cuando el pedido no lo tiene', () => {
    expect(formatDireccionPedido({ direccion: 'Calle 10 # 5-30', ciudad: 'Medellín', codigoPostal: null }))
      .toBe('Calle 10 # 5-30, Medellín')
  })
})

import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreatePedidoDto } from './create-pedido.dto'

const BASE = {
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  telefono: '3001234567',
  direccion: 'Calle 10 # 5-30',
  ciudad: 'Medellín',
  codigoPostal: '050001',
  items: [{ productoId: 'p1', cantidad: 2 }],
}

describe('CreatePedidoDto', () => {
  it('es válido con todos los campos', async () => {
    const dto = plainToInstance(CreatePedidoDto, BASE)
    const errores = await validate(dto)
    expect(errores).toHaveLength(0)
  })

  it('rechaza si falta teléfono, ciudad o código postal', async () => {
    const sinTelefono = plainToInstance(CreatePedidoDto, { ...BASE, telefono: undefined })
    const sinCiudad = plainToInstance(CreatePedidoDto, { ...BASE, ciudad: undefined })
    const sinCP = plainToInstance(CreatePedidoDto, { ...BASE, codigoPostal: undefined })
    expect((await validate(sinTelefono)).length).toBeGreaterThan(0)
    expect((await validate(sinCiudad)).length).toBeGreaterThan(0)
    expect((await validate(sinCP)).length).toBeGreaterThan(0)
  })
})

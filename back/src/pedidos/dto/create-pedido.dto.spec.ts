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

  const erroresDe = async (data: Record<string, unknown>) =>
    (await validate(plainToInstance(CreatePedidoDto, data))).map(e => e.property)

  it('rechaza cantidades negativas, cero o con decimales', async () => {
    for (const cantidad of [-100, 0, 0.5]) {
      expect(await erroresDe({ ...BASE, items: [{ productoId: 'p1', cantidad }] })).toContain('items')
    }
  })

  it('rechaza un pedido sin productos', async () => {
    expect(await erroresDe({ ...BASE, items: [] })).toContain('items')
  })

  it('rechaza email inválido y teléfono sin dígitos suficientes', async () => {
    expect(await erroresDe({ ...BASE, email: 'no-es-email' })).toContain('email')
    expect(await erroresDe({ ...BASE, telefono: 'abcdefg' })).toContain('telefono')
  })

  it('rechaza una dirección de más de 200 caracteres', async () => {
    expect(await erroresDe({ ...BASE, direccion: 'x'.repeat(201) })).toContain('direccion')
  })

  it('acepta el honeypot como campo opcional', async () => {
    expect(await erroresDe({ ...BASE, website: '' })).toEqual([])
  })
})

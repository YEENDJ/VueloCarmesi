import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateProductoDto } from './create-producto.dto'

const BASE = {
  nombre: 'Chocolate Negro 70%',
  slug: 'chocolate-negro-70',
  descripcion: 'Tableta 80g',
  precio: 22000,
  stock: 40,
  categoria: 'chocolates',
}

describe('CreateProductoDto', () => {
  it('es válido sin badge', async () => {
    const dto = plainToInstance(CreateProductoDto, { ...BASE })
    const errores = await validate(dto)
    expect(errores).toHaveLength(0)
  })

  it('acepta badge "Nuevo" o "Destacado"', async () => {
    const nuevo = plainToInstance(CreateProductoDto, { ...BASE, badge: 'Nuevo' })
    const destacado = plainToInstance(CreateProductoDto, { ...BASE, badge: 'Destacado' })
    expect(await validate(nuevo)).toHaveLength(0)
    expect(await validate(destacado)).toHaveLength(0)
  })

  it('rechaza un badge que no sea Nuevo/Destacado', async () => {
    const dto = plainToInstance(CreateProductoDto, { ...BASE, badge: 'Oferta' })
    const errores = await validate(dto)
    expect(errores.length).toBeGreaterThan(0)
  })
})

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateContactoDto, MAX_MENSAJE_CONTACTO } from './create-contacto.dto'

const base = {
  nombre: 'Ana García',
  email: 'ana@test.com',
  mensaje: '¿Abren los lunes?',
}

async function erroresDe(data: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateContactoDto, data))
  return errors.map(e => e.property)
}

describe('CreateContactoDto', () => {
  it('acepta un body válido sin teléfono', async () => {
    expect(await erroresDe(base)).toEqual([])
  })

  it('acepta un teléfono opcional con formato colombiano', async () => {
    expect(await erroresDe({ ...base, telefono: '+57 311 817 1907' })).toEqual([])
  })

  it('rechaza un teléfono que no lo es', async () => {
    expect(await erroresDe({ ...base, telefono: '12345' })).toContain('telefono')
    expect(await erroresDe({ ...base, telefono: 'llámame' })).toContain('telefono')
  })

  it('rechaza nombre y mensaje de solo espacios', async () => {
    expect(await erroresDe({ ...base, nombre: '   ' })).toContain('nombre')
    expect(await erroresDe({ ...base, mensaje: '   ' })).toContain('mensaje')
  })

  it('acepta nombres de dos letras', async () => {
    expect(await erroresDe({ ...base, nombre: 'Li' })).toEqual([])
  })

  it('rechaza un mensaje por encima del tope', async () => {
    expect(await erroresDe({ ...base, mensaje: 'x'.repeat(MAX_MENSAJE_CONTACTO + 1) }))
      .toContain('mensaje')
  })

  it('rechaza un email inválido', async () => {
    expect(await erroresDe({ ...base, email: 'no-es-email' })).toContain('email')
  })

  it('hace trim antes de guardar', async () => {
    const dto = plainToInstance(CreateContactoDto, { ...base, nombre: '  Ana  ', telefono: ' 3001234567 ' })
    expect(await validate(dto)).toEqual([])
    expect(dto.nombre).toBe('Ana')
    expect(dto.telefono).toBe('3001234567')
  })
})

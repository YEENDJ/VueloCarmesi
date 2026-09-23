import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateReservaDto } from './create-reserva.dto'

const base = {
  experienciaId: 'exp1',
  fecha: '2026-08-15',
  cantidadPersonas: 2,
  nombre: 'Ana García',
  email: 'ana@test.com',
  telefono: '+57 300 123-4567',
}

async function erroresDe(data: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateReservaDto, data)
  const errors = await validate(dto)
  return errors.map(e => e.property)
}

describe('CreateReservaDto', () => {
  it('acepta un body válido', async () => {
    expect(await erroresDe(base)).toEqual([])
  })

  it('hace trim de las notas', async () => {
    const dto = plainToInstance(CreateReservaDto, { ...base, notas: '  Sin gluten  ' })
    expect(await validate(dto)).toEqual([])
    expect(dto.notas).toBe('Sin gluten')
  })

  it('acepta notas y website opcionales', async () => {
    expect(await erroresDe({ ...base, notas: 'Sin gluten', website: '' })).toEqual([])
  })

  it('acepta nombres reales de dos letras', async () => {
    expect(await erroresDe({ ...base, nombre: 'Li' })).toEqual([])
  })

  it('rechaza nombre de una letra, vacío o de solo espacios', async () => {
    expect(await erroresDe({ ...base, nombre: 'A' })).toContain('nombre')
    expect(await erroresDe({ ...base, nombre: '   ' })).toContain('nombre')
    expect(await erroresDe({ ...base, nombre: 'x'.repeat(101) })).toContain('nombre')
  })

  it('hace trim del nombre antes de validar', async () => {
    const dto = plainToInstance(CreateReservaDto, { ...base, nombre: '  Ana García  ' })
    expect(await validate(dto)).toEqual([])
    expect(dto.nombre).toBe('Ana García')
  })

  it('rechaza emails inválidos o demasiado largos', async () => {
    expect(await erroresDe({ ...base, email: 'no-es-email' })).toContain('email')
    expect(await erroresDe({ ...base, email: `${'x'.repeat(250)}@test.com` })).toContain('email')
  })

  it('valida el teléfono: 7-15 dígitos con + opcional y separadores', async () => {
    expect(await erroresDe({ ...base, telefono: '3001234567' })).toEqual([])
    expect(await erroresDe({ ...base, telefono: '+1 212 555 0100' })).toEqual([])
    expect(await erroresDe({ ...base, telefono: '123456' })).toContain('telefono')       // 6 dígitos
    expect(await erroresDe({ ...base, telefono: '1'.repeat(16) })).toContain('telefono') // 16 dígitos
    expect(await erroresDe({ ...base, telefono: 'abc1234567' })).toContain('telefono')
  })

  it('rechaza cantidadPersonas decimal o menor a 1', async () => {
    expect(await erroresDe({ ...base, cantidadPersonas: 2.5 })).toContain('cantidadPersonas')
    expect(await erroresDe({ ...base, cantidadPersonas: 0 })).toContain('cantidadPersonas')
  })

  it('rechaza fecha que no sea ISO', async () => {
    expect(await erroresDe({ ...base, fecha: '15/08/2026' })).toContain('fecha')
  })

  it('rechaza notas de más de 500 caracteres', async () => {
    expect(await erroresDe({ ...base, notas: 'x'.repeat(501) })).toContain('notas')
  })

  it('rechaza estado como propiedad no permitida', async () => {
    // simula el ValidationPipe global (whitelist + forbidNonWhitelisted):
    // al quitar los decoradores de estado, pasa a ser propiedad desconocida
    const dto = plainToInstance(CreateReservaDto, { ...base, estado: 'confirmada' })
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
    expect(errors.map(e => e.property)).toContain('estado')
  })
})

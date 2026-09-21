import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateSolicitudGrupoDto } from './create-solicitud-grupo.dto'

const base = {
  tipo: 'colegio',
  institucion: 'Colegio Dorado',
  contacto: 'Ana Ruiz',
  email: 'ana@colegiodorado.edu.co',
  telefono: '+57 311 817 1907',
  personas: 40,
}

async function erroresDe(data: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateSolicitudGrupoDto, data)
  const errors = await validate(dto)
  return errors.map(e => e.property)
}

describe('CreateSolicitudGrupoDto', () => {
  it('acepta un body mínimo válido', async () => {
    expect(await erroresDe(base)).toEqual([])
  })

  it('acepta el body completo', async () => {
    expect(
      await erroresDe({
        ...base,
        nit: '900123456-1',
        cargo: 'Coordinadora académica',
        edades: '14 a 16 años',
        fechaTentativa: '2026-10-14',
        experiencias: ['experiencia-cacaotera', 'avistamiento-de-aves'],
        requiereTransporte: true,
        requiereFactura: true,
        mensaje: 'Somos dos cursos de décimo.',
        website: '',
      }),
    ).toEqual([])
  })

  it('acepta grupos por encima de la capacidad de una experiencia', async () => {
    // El motivo de existir de esta tabla: /reservar/[slug] corta en 12 y este
    // comprador llega con 40. Si esto se rompe, la página de grupos no sirve.
    expect(await erroresDe({ ...base, personas: 120 })).toEqual([])
  })

  it('rechaza un tipo de solicitante fuera de la lista', async () => {
    expect(await erroresDe({ ...base, tipo: 'fundacion' })).toContain('tipo')
  })

  it('rechaza personas decimal, menor a 1 o por encima del tope', async () => {
    expect(await erroresDe({ ...base, personas: 2.5 })).toContain('personas')
    expect(await erroresDe({ ...base, personas: 0 })).toContain('personas')
    expect(await erroresDe({ ...base, personas: 501 })).toContain('personas')
  })

  it('rechaza institución corta, vacía o de solo espacios', async () => {
    expect(await erroresDe({ ...base, institucion: 'AB' })).toContain('institucion')
    expect(await erroresDe({ ...base, institucion: '   ' })).toContain('institucion')
    expect(await erroresDe({ ...base, institucion: 'x'.repeat(141) })).toContain('institucion')
  })

  it('hace trim de institución y contacto antes de validar', async () => {
    const dto = plainToInstance(CreateSolicitudGrupoDto, {
      ...base,
      institucion: '  Colegio Dorado  ',
      contacto: '  Ana Ruiz  ',
    })
    expect(await validate(dto)).toEqual([])
    expect(dto.institucion).toBe('Colegio Dorado')
    expect(dto.contacto).toBe('Ana Ruiz')
  })

  it('valida el teléfono con la misma regla que las reservas', async () => {
    expect(await erroresDe({ ...base, telefono: '3118171907' })).toEqual([])
    expect(await erroresDe({ ...base, telefono: '123456' })).toContain('telefono')
    expect(await erroresDe({ ...base, telefono: 'abc1234567' })).toContain('telefono')
  })

  it('rechaza emails inválidos o demasiado largos', async () => {
    expect(await erroresDe({ ...base, email: 'no-es-email' })).toContain('email')
    expect(await erroresDe({ ...base, email: `${'x'.repeat(250)}@test.com` })).toContain('email')
  })

  it('deja la fecha tentativa opcional, pero la exige en ISO', async () => {
    expect(await erroresDe({ ...base, fechaTentativa: undefined })).toEqual([])
    expect(await erroresDe({ ...base, fechaTentativa: '14/10/2026' })).toContain('fechaTentativa')
  })

  it('rechaza mensaje de más de 1000 caracteres', async () => {
    expect(await erroresDe({ ...base, mensaje: 'x'.repeat(1001) })).toContain('mensaje')
  })

  it('rechaza el estado como propiedad no permitida', async () => {
    // Simula el ValidationPipe global: nadie crea una solicitud ya «cotizada».
    const dto = plainToInstance(CreateSolicitudGrupoDto, { ...base, estado: 'cotizada' })
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
    expect(errors.map(e => e.property)).toContain('estado')
  })
})

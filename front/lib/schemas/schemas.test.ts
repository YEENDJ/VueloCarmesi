import { describe, expect, it } from 'vitest'
import { reservaSchema } from './reserva'
import { contactoSchema } from './contacto'
import { fechaMinima, fechaMaximaReserva } from './comunes'

/** La primera clave de error del campo, o undefined si pasa. */
function errorDe(res: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, campo: string) {
  return res.error?.issues.find(i => i.path[0] === campo)?.message
}

describe('reservaSchema', () => {
  const schema = reservaSchema(12)
  const base = {
    nombre: 'Ana García',
    telefono: '+57 300 123 4567',
    email: 'ana@test.com',
    fecha: fechaMinima(),
    cantidadPersonas: 2,
    notas: '',
  }

  it('acepta una reserva válida', () => {
    expect(schema.safeParse(base).success).toBe(true)
  })

  it('acepta nombres de dos letras', () => {
    expect(schema.safeParse({ ...base, nombre: 'Li' }).success).toBe(true)
  })

  it('rechaza hoy y acepta el último día del horizonte', () => {
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    expect(errorDe(schema.safeParse({ ...base, fecha: hoy }), 'fecha')).toBe('errorFecha')
    expect(schema.safeParse({ ...base, fecha: fechaMaximaReserva() }).success).toBe(true)
  })

  it('pide la fecha si viene vacía', () => {
    expect(errorDe(schema.safeParse({ ...base, fecha: '' }), 'fecha')).toBe('errorFechaVacia')
  })

  it('corta en la capacidad de la experiencia', () => {
    expect(errorDe(schema.safeParse({ ...base, cantidadPersonas: 13 }), 'cantidadPersonas'))
      .toBe('errorPersonas')
  })

  it('rechaza un teléfono con letras', () => {
    expect(errorDe(schema.safeParse({ ...base, telefono: 'abc1234567' }), 'telefono'))
      .toBe('errorTelefono')
  })
})

describe('contactoSchema', () => {
  const base = { nombre: 'Ana', email: 'ana@test.com', mensaje: 'Hola' }

  it('acepta el formulario sin teléfono', () => {
    expect(contactoSchema.safeParse(base).success).toBe(true)
    expect(contactoSchema.safeParse({ ...base, telefono: '' }).success).toBe(true)
  })

  it('valida el teléfono solo si lo escriben', () => {
    expect(contactoSchema.safeParse({ ...base, telefono: '311 817 1907' }).success).toBe(true)
    expect(errorDe(contactoSchema.safeParse({ ...base, telefono: '123' }), 'telefono'))
      .toBe('errorTelefono')
  })

  it('rechaza un mensaje de solo espacios', () => {
    expect(errorDe(contactoSchema.safeParse({ ...base, mensaje: '   ' }), 'mensaje'))
      .toBe('errorMensaje')
  })
})

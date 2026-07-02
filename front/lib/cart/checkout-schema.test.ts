import { describe, it, expect } from 'vitest'
import { checkoutSchema } from './checkout-schema'

const VALID = {
  nombre: 'Ana Pérez', email: 'ana@example.com', telefono: '3001234567',
  direccion: 'Calle 10 # 5-30', ciudad: 'Medellín', codigoPostal: '050001',
}

describe('checkoutSchema', () => {
  it('acepta datos válidos', () => {
    expect(checkoutSchema.safeParse(VALID).success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    expect(checkoutSchema.safeParse({ ...VALID, nombre: '' }).success).toBe(false)
  })

  it('rechaza email inválido', () => {
    expect(checkoutSchema.safeParse({ ...VALID, email: 'no-es-un-email' }).success).toBe(false)
  })

  it('rechaza teléfono muy corto', () => {
    expect(checkoutSchema.safeParse({ ...VALID, telefono: '123' }).success).toBe(false)
  })

  it('rechaza campos de entrega vacíos', () => {
    expect(checkoutSchema.safeParse({ ...VALID, direccion: '' }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...VALID, ciudad: '' }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...VALID, codigoPostal: '' }).success).toBe(false)
  })
})

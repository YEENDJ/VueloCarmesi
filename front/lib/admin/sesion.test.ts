import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { crearSesion, sesionValida, contrasenaCorrecta, DURACION_SESION_S } from './sesion'

const SECRETO = 's'.repeat(48)
const original = { secreto: process.env.ADMIN_SESSION_SECRET, pass: process.env.ADMIN_PASSWORD }

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = SECRETO
  process.env.ADMIN_PASSWORD = 'la-de-verdad'
})
afterAll(() => {
  process.env.ADMIN_SESSION_SECRET = original.secreto
  process.env.ADMIN_PASSWORD = original.pass
})

describe('sesión del panel', () => {
  it('acepta la sesión que acaba de firmar', () => {
    expect(sesionValida(crearSesion())).toBe(true)
  })

  // El agujero que se cerró: esta cookie la podía escribir cualquiera.
  it('rechaza la cookie vieja', () => {
    expect(sesionValida('authenticated')).toBe(false)
  })

  it('rechaza una sesión sin cookie', () => {
    expect(sesionValida(undefined)).toBe(false)
  })

  it('rechaza una sesión a la que le alargaron la fecha', () => {
    const [v, vence, firma] = crearSesion().split('.')
    expect(sesionValida(`${v}.${Number(vence) + 10 ** 10}.${firma}`)).toBe(false)
  })

  it('rechaza una firma cambiada', () => {
    const token = crearSesion()
    const ultimo = token.at(-1) === 'A' ? 'B' : 'A'
    expect(sesionValida(token.slice(0, -1) + ultimo)).toBe(false)
  })

  it('rechaza la sesión firmada con otro secreto', () => {
    const token = crearSesion()
    process.env.ADMIN_SESSION_SECRET = 'o'.repeat(48)
    expect(sesionValida(token)).toBe(false)
  })

  it('vence a los 7 días', () => {
    const ahora = Date.now()
    const token = crearSesion(ahora)
    expect(sesionValida(token, ahora + DURACION_SESION_S * 1000 - 1)).toBe(true)
    expect(sesionValida(token, ahora + DURACION_SESION_S * 1000 + 1)).toBe(false)
  })

  it('sin secreto no firma y ninguna sesión vale', () => {
    const token = crearSesion()
    delete process.env.ADMIN_SESSION_SECRET
    expect(() => crearSesion()).toThrow()
    expect(sesionValida(token)).toBe(false)
  })

  it('no firma con un secreto corto', () => {
    process.env.ADMIN_SESSION_SECRET = 'corto'
    expect(() => crearSesion()).toThrow()
  })
})

describe('contraseña del login', () => {
  it('acepta la correcta y rechaza las demás', () => {
    expect(contrasenaCorrecta('la-de-verdad')).toBe(true)
    expect(contrasenaCorrecta('la-de-verda')).toBe(false)
    expect(contrasenaCorrecta('')).toBe(false)
    expect(contrasenaCorrecta(undefined)).toBe(false)
  })

  it('no deja entrar si ADMIN_PASSWORD no está configurada', () => {
    delete process.env.ADMIN_PASSWORD
    expect(contrasenaCorrecta('')).toBe(false)
    expect(contrasenaCorrecta('undefined')).toBe(false)
  })
})

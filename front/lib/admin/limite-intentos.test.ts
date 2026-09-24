import { describe, it, expect } from 'vitest'
import {
  MAX_FALLOS, VENTANA_MS, bloqueoRestante, ipDe, limpiarFallos, registrarFallo,
} from './limite-intentos'

describe('límite de intentos del login', () => {
  it('deja intentar hasta el quinto fallo y bloquea desde ahí', () => {
    const ip = '10.0.0.1'
    for (let i = 0; i < MAX_FALLOS - 1; i++) registrarFallo(ip, 1000)
    expect(bloqueoRestante(ip, 1000)).toBe(0)
    registrarFallo(ip, 1000)
    expect(bloqueoRestante(ip, 1000)).toBe(VENTANA_MS)
  })

  it('el bloqueo se levanta al cumplirse la ventana', () => {
    const ip = '10.0.0.2'
    for (let i = 0; i < MAX_FALLOS; i++) registrarFallo(ip, 0)
    expect(bloqueoRestante(ip, VENTANA_MS - 1)).toBe(1)
    expect(bloqueoRestante(ip, VENTANA_MS)).toBe(0)
  })

  it('un acierto borra los fallos', () => {
    const ip = '10.0.0.3'
    for (let i = 0; i < MAX_FALLOS; i++) registrarFallo(ip, 0)
    limpiarFallos(ip)
    expect(bloqueoRestante(ip, 0)).toBe(0)
  })

  it('cada IP lleva su propia cuenta', () => {
    for (let i = 0; i < MAX_FALLOS; i++) registrarFallo('10.0.0.4', 0)
    expect(bloqueoRestante('10.0.0.5', 0)).toBe(0)
  })

  it('toma la primera IP de x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '181.1.2.3, 76.76.21.21' })
    expect(ipDe(h)).toBe('181.1.2.3')
  })
})

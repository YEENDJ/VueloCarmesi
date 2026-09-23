import { describe, it, expect } from 'vitest'
import { rutaPermitida } from './rutas-permitidas'

describe('rutas que reenvía el puente del panel', () => {
  it('deja pasar lo que usa el panel', () => {
    expect(rutaPermitida('GET', 'reservas')).toBe(true)
    expect(rutaPermitida('PATCH', 'reservas/abc123/estado')).toBe(true)
    expect(rutaPermitida('GET', 'pedidos/abc123')).toBe(true)
    expect(rutaPermitida('POST', 'experiencias')).toBe(true)
    expect(rutaPermitida('DELETE', 'productos/abc123')).toBe(true)
    expect(rutaPermitida('GET', 'solicitudes-grupo')).toBe(true)
    expect(rutaPermitida('PATCH', 'solicitudes-grupo/abc123/estado')).toBe(true)
  })

  it('no reenvía rutas que no están en la lista', () => {
    expect(rutaPermitida('GET', 'site-config')).toBe(false)
    expect(rutaPermitida('POST', 'uploads/image')).toBe(false)
    expect(rutaPermitida('GET', 'cualquier-cosa')).toBe(false)
  })

  it('no reenvía con otro método del que está permitido', () => {
    expect(rutaPermitida('DELETE', 'reservas')).toBe(false)
    expect(rutaPermitida('POST', 'reservas/abc123')).toBe(false)
  })

  it('no se deja engañar con rutas relativas ni pegadas', () => {
    expect(rutaPermitida('GET', 'reservas/../site-config')).toBe(false)
    expect(rutaPermitida('GET', 'reservas/abc/def')).toBe(false)
    expect(rutaPermitida('GET', 'reservasX')).toBe(false)
    expect(rutaPermitida('GET', 'reservas/abc?x=1')).toBe(false)
  })
})

'use client'
import { useEffect, useState } from 'react'

/**
 * Cliente de la pasarela de pagos: lo que hablan el checkout, el formulario de
 * reserva y las páginas de resultado con `back/src/pagos/`.
 *
 * Diseño y casos de fallo en docs/superpowers/specs/2026-09-25-pasarela-pagos-design.md.
 */

const API = process.env.NEXT_PUBLIC_API_URL

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'anulado' | 'expirado' | 'error'

export interface ConfigPagos {
  activo: boolean
  porcentajeAbono: number
}

export interface EstadoPublico {
  referencia: string
  estado: EstadoPago
  monto: number
  motivo: string | null
  tipo: 'pedido' | 'reserva'
  estadoDueno: string | null
  venceEn: string | null
  total: number | null
  codigo: string | null
}

export interface Intento {
  referencia: string
  url: string
  monto: number
}

/** Un error con el código HTTP, para que la página decida qué texto mostrar. */
export class ErrorPago extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ErrorPago(res.status, typeof body?.message === 'string' ? body.message : `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const obtenerConfigPagos = () => pedir<ConfigPagos>('/pagos/config')

export const crearPago = (dueno: { pedidoId: string } | { reservaId: string }, idioma: string) =>
  pedir<Intento>('/pagos', { method: 'POST', body: JSON.stringify({ ...dueno, idioma }) })

export const reintentarPago = (referencia: string, idioma: string) =>
  pedir<Intento>(`/pagos/reintentar/${encodeURIComponent(referencia)}`, {
    method: 'POST', body: JSON.stringify({ idioma }),
  })

export const obtenerEstadoPago = (referencia: string) =>
  pedir<EstadoPublico>(`/pagos/estado/${encodeURIComponent(referencia)}`, { cache: 'no-store' })

/**
 * La configuración de pagos, o `null` mientras carga o si el backend no
 * responde. `null` se trata como «sin pasarela»: es el flujo que hay hoy, y
 * mostrar «Pagar» sin saber si hay pasarela sería prometer algo.
 */
export function useConfigPagos(): ConfigPagos | null {
  const [config, setConfig] = useState<ConfigPagos | null>(null)
  useEffect(() => {
    let vivo = true
    obtenerConfigPagos().then(c => { if (vivo) setConfig(c) }).catch(() => {})
    return () => { vivo = false }
  }, [])
  return config
}

/**
 * Lo que se cobra hoy de una reserva. Gemelo de `calcularAbono` en
 * back/src/pagos/abono.ts: tienen que dar la misma cifra, porque esta es la que
 * se anuncia y aquella la que se cobra. Si cambias uno, cambia el otro.
 */
export function calcularAbono(total: number, porcentaje: number): number {
  return Math.round((total * porcentaje) / 100)
}

// --- Qué pantalla mostrar ----------------------------------------------------

export type VistaResultado = 'aprobado' | 'pendiente' | 'rechazado' | 'vencido' | 'revision'

/** Estados del pedido o la reserva que significan «ya está pagado». */
const DUENO_PAGADO = ['pagado', 'enviado', 'entregado', 'pendiente', 'confirmada']
const DUENO_VENCIDO = ['expirado', 'expirada', 'cancelado', 'cancelada']

/**
 * La pantalla que corresponde a un pago. Manda lo que le pasó al pedido o a la
 * reserva, no solo al intento: si este intento se rechazó pero otro de la
 * misma compra se aprobó, el cliente ya pagó y eso es lo que tiene que ver.
 */
export function vistaDe(e: EstadoPublico, ahora = new Date()): VistaResultado {
  const dueno = e.estadoDueno ?? ''
  if (dueno === 'requiere_revision' || e.estado === 'anulado') return 'revision'
  if (DUENO_PAGADO.includes(dueno)) return 'aprobado'
  if (e.estado === 'pendiente') return 'pendiente'
  if (DUENO_VENCIDO.includes(dueno)) return 'vencido'
  if (e.venceEn && new Date(e.venceEn) <= ahora) return 'vencido'
  if (e.estado === 'aprobado') return 'aprobado'
  return 'rechazado'
}

// --- Pago en curso ----------------------------------------------------------

/**
 * La referencia del pago que el cliente dejó abierto al irse a la pasarela.
 *
 * El carrito se vacía solo cuando el pago queda aprobado, y eso se sabe en la
 * página de resultado. Pero quien paga y cierra la pestaña sin volver nunca
 * llega ahí, y encontraría su carrito lleno con lo que ya compró. Con esta
 * referencia, el checkout pregunta al abrirse cómo terminó ese pago.
 *
 * localStorage puede no existir (modo privado, almacenamiento bloqueado): todo
 * va en try/catch y sin él el flujo funciona igual, solo sin esa comprobación.
 */
const CLAVE_PENDIENTE = 'vuelo-carmesi:pago-pendiente'

export function guardarPagoPendiente(referencia: string): void {
  try { window.localStorage.setItem(CLAVE_PENDIENTE, referencia) } catch { /* sin almacenamiento */ }
}

export function leerPagoPendiente(): string | null {
  try { return window.localStorage.getItem(CLAVE_PENDIENTE) } catch { return null }
}

export function olvidarPagoPendiente(): void {
  try { window.localStorage.removeItem(CLAVE_PENDIENTE) } catch { /* sin almacenamiento */ }
}

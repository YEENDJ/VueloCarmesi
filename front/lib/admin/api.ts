import type {
  AdminReserva, AdminExperiencia, AdminProducto, AdminPedido,
  EstadoReserva, EstadoPedido,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Reservas ───────────────────────────────────────────────
export function getReservas(): Promise<AdminReserva[]> {
  return fetch(`${BASE}/reservas`).then(r => r.json())
}
export function getReserva(id: string): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}`).then(r => r.json())
}
export function updateEstadoReserva(id: string, estado: EstadoReserva): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(r => r.json())
}

// ── Experiencias ───────────────────────────────────────────
export function getExperienciasAdmin(): Promise<AdminExperiencia[]> {
  return fetch(`${BASE}/experiencias`).then(r => r.json())
}
export function createExperiencia(data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${BASE}/experiencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function updateExperiencia(id: string, data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${BASE}/experiencias/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function deleteExperiencia(id: string): Promise<void> {
  return fetch(`${BASE}/experiencias/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ── Productos ──────────────────────────────────────────────
export function getProductosAdmin(): Promise<AdminProducto[]> {
  return fetch(`${BASE}/productos`).then(r => r.json())
}
export function createProducto(data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function updateProducto(id: string, data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${BASE}/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function deleteProducto(id: string): Promise<void> {
  return fetch(`${BASE}/productos/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ── Pedidos ────────────────────────────────────────────────
export function getPedidos(): Promise<AdminPedido[]> {
  return fetch(`${BASE}/pedidos`).then(r => r.json())
}
export function getPedido(id: string): Promise<AdminPedido> {
  return fetch(`${BASE}/pedidos/${id}`).then(r => r.json())
}
export function updateEstadoPedido(id: string, estado: EstadoPedido): Promise<AdminPedido> {
  return fetch(`${BASE}/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(r => r.json())
}

import type {
  AdminReserva, AdminExperiencia, AdminProducto, AdminPedido,
  EstadoReserva, EstadoPedido,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function checked(r: Response) {
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}

// ── Reservas ───────────────────────────────────────────────
export function getReservas(): Promise<AdminReserva[]> {
  return fetch(`${BASE}/reservas`).then(checked)
}
export function getReserva(id: string): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}`).then(checked)
}
export function updateEstadoReserva(id: string, estado: EstadoReserva): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(checked)
}

// ── Experiencias ───────────────────────────────────────────
export function getExperienciasAdmin(): Promise<AdminExperiencia[]> {
  return fetch(`${BASE}/experiencias`).then(checked)
}
export function createExperiencia(data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${BASE}/experiencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
export function updateExperiencia(id: string, data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${BASE}/experiencias/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
export function deleteExperiencia(id: string): Promise<void> {
  return fetch(`${BASE}/experiencias/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ── Productos ──────────────────────────────────────────────
export function getProductosAdmin(): Promise<AdminProducto[]> {
  return fetch(`${BASE}/productos`).then(checked)
}
export function createProducto(data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
export function updateProducto(id: string, data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${BASE}/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
export function deleteProducto(id: string): Promise<void> {
  return fetch(`${BASE}/productos/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ── Pedidos ────────────────────────────────────────────────
export function getPedidos(): Promise<AdminPedido[]> {
  return fetch(`${BASE}/pedidos`).then(checked)
}
export function getPedido(id: string): Promise<AdminPedido> {
  return fetch(`${BASE}/pedidos/${id}`).then(checked)
}
export function updateEstadoPedido(id: string, estado: EstadoPedido): Promise<AdminPedido> {
  return fetch(`${BASE}/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(checked)
}

// ── Uploads ────────────────────────────────────────────────
export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/uploads/image`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Upload error ${res.status}`)
  return res.json()
}

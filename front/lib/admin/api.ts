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
export function updateEstadoReserva(id: string, estado: EstadoReserva, motivo?: string): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, ...(motivo ? { motivo } : {}) }),
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
/**
 * El backend explica por qué rechaza una foto —el peso, el formato, el caso del
 * HEIC de iPhone— y ese texto es lo único que quien sube puede accionar. Antes
 * se descartaba y el panel decía "revisa formato y tamaño" para todo, así que
 * una foto en HEIC y una de 20 MB daban el mismo aviso inútil.
 */
export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/uploads/image`, { method: 'POST', body: form, credentials: 'include' })

  if (!res.ok) {
    // Si la respuesta no trae cuerpo JSON —un 502 del proxy, por ejemplo— se
    // cae al código de estado, que al menos distingue un fallo de red de un
    // archivo rechazado.
    const motivo = await res.json().then(
      (d: { message?: string | string[] }) =>
        Array.isArray(d.message) ? d.message.join('. ') : d.message,
      () => undefined,
    )
    throw new Error(motivo || `Upload error ${res.status}`)
  }

  return res.json()
}

/**
 * Borra la imagen de Cloudinary al quitarla de una galería. No lanza si falla:
 * dejar un archivo huérfano allá es molesto, pero impedir que el panel guarde
 * por eso lo es más. El backend ya trata como éxito el caso de "ya no existe".
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    await fetch(`${BASE}/uploads/image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      credentials: 'include',
    })
  } catch {
    // silencio deliberado: ver comentario de arriba
  }
}

// ── SiteConfig ─────────────────────────────────────────────
export function getSiteConfigAdmin(): Promise<Record<string, string>> {
  return fetch(`${BASE}/site-config`).then(checked)
}
export function patchSiteConfig(data: Record<string, string>): Promise<Record<string, string>> {
  return fetch(`${BASE}/site-config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  }).then(checked)
}

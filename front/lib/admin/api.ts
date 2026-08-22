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
 * Tope de subida, en bytes. Son 4 MB y no 5 porque el archivo pasa por el
 * puente de app/api/admin/, y esa capa corta el cuerpo de la petición en torno
 * a 4,5 MB en la mayoría de los alojamientos: con el tope más alto quedaba una
 * franja de archivos que se cortaban por el camino, con un error que no era el
 * que correspondía.
 *
 * Su gemelo es `MAX_BYTES` en back/src/uploads/uploads.service.ts, que es la
 * comprobación que manda. Si cambia uno, cambia el otro.
 */
export const MAX_SUBIDA_BYTES = 4 * 1024 * 1024

/**
 * Las tres llamadas que exigen sesión de admin —subir foto, borrarla y guardar
 * Configuración— van contra este mismo origen y no contra `BASE`, y desde ahí
 * las reenvía app/api/admin/. La cookie `admin_session` es host-only de este
 * dominio: llamando directo al backend, que en producción vive en otro, el
 * navegador no la mandaba y todo respondía 401. El porqué largo está en
 * app/api/admin/proxy.ts.
 *
 * El puente devuelve la respuesta del backend tal cual, así que el motivo del
 * rechazo —el peso, el formato, el caso del HEIC de iPhone— sigue llegando
 * entero hasta el aviso que ve quien sube la foto.
 */
export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  // El peso se mira aquí, antes de gastar la subida. El backend lo comprueba
  // igual —es quien manda— pero rechazarlo allá significa esperar a que el
  // archivo entero cruce la red para que te digan que era muy grande, y en la
  // conexión de la finca eso son varios minutos tirados.
  if (file.size > MAX_SUBIDA_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1).replace('.', ',')
    throw new Error(`La foto pesa ${mb} MB y el máximo son 4 MB. Redúcela e inténtalo de nuevo.`)
  }

  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/uploads', { method: 'POST', body: form })

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
    await fetch('/api/admin/uploads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
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
  return fetch('/api/admin/site-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}

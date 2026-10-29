import type {
  AdminReserva, AdminExperiencia, AdminProducto, AdminPedido,
  EstadoReserva, EstadoPedido, AdminSolicitudGrupo, EstadoSolicitud,
  AdminContacto, EstadoContacto, AdminAve,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Todo lo que lee datos privados o cambia algo va por el puente del propio
 * front (app/api/admin/backend/), no contra `BASE`. En el backend esas rutas
 * exigen `x-admin-key`, una clave que solo tiene el servidor del front y que el
 * navegador nunca ve; el puente la pone después de validar la sesión firmada.
 *
 * Contra `BASE` quedan solo las lecturas públicas —productos—, las mismas que
 * usa la web. Las experiencias no: el panel necesita ver también las archivadas.
 */
const ADMIN = '/api/admin/backend'

function checked(r: Response) {
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}

/** Lo que impide un borrado: un resumen y los pedidos o reservas a resolver, con su id para abrirlos. */
export interface BloqueoBorrado {
  resumen: string
  pendientes: { id: string; etiqueta: string; estado: string }[]
  /** Cuántos más hay además de los listados. */
  restantes: number
}

/**
 * Lo que impide borrar un producto, experiencia o pedido, o nulo si se puede.
 * El panel lo pregunta antes de abrir la confirmación; el DELETE vuelve a
 * comprobarlo de todos modos.
 */
export function getBloqueoBorrado(recurso: 'productos' | 'experiencias' | 'pedidos' | 'reservas', id: string): Promise<BloqueoBorrado | null> {
  return fetch(`${ADMIN}/${recurso}/${id}/bloqueo-borrado`, { cache: 'no-store' })
    .then(checked)
    .then((d: { motivo: string | null } & Partial<BloqueoBorrado>) =>
      d.motivo ? { resumen: d.resumen ?? d.motivo, pendientes: d.pendientes ?? [], restantes: d.restantes ?? 0 } : null)
}

// ── Reservas ───────────────────────────────────────────────
export function getReservas(): Promise<AdminReserva[]> {
  return fetch(`${ADMIN}/reservas`).then(checked)
}
export function getReserva(id: string): Promise<AdminReserva> {
  return fetch(`${ADMIN}/reservas/${id}`).then(checked)
}
/** Rechaza con el motivo si tiene pagos registrados: el panel lo muestra en la alerta. */
export function deleteReserva(id: string): Promise<void> {
  return fetch(`${ADMIN}/reservas/${id}`, { method: 'DELETE' }).then(conMotivo).then(() => undefined)
}
export function updateEstadoReserva(id: string, estado: EstadoReserva, motivo?: string): Promise<AdminReserva> {
  return fetch(`${ADMIN}/reservas/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, ...(motivo ? { motivo } : {}) }),
  }).then(conMotivo)
}

// ── Experiencias ───────────────────────────────────────────
/**
 * Incluye las archivadas, que la lista pública ya no devuelve: sin ellas el
 * panel no podría restaurarlas. Por eso va por el puente y no contra `BASE`.
 */
export function getExperienciasAdmin(): Promise<AdminExperiencia[]> {
  return fetch(`${ADMIN}/experiencias/admin`, { cache: 'no-store' }).then(checked)
}
export function createExperiencia(data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${ADMIN}/experiencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
export function updateExperiencia(id: string, data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${ADMIN}/experiencias/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
/** Rechaza con el motivo si tiene reservas en curso: el panel lo muestra en la alerta. */
export function deleteExperiencia(id: string): Promise<void> {
  return fetch(`${ADMIN}/experiencias/${id}`, { method: 'DELETE' }).then(conMotivo).then(() => undefined)
}

// ── Productos ──────────────────────────────────────────────
export function getProductosAdmin(): Promise<AdminProducto[]> {
  return fetch(`${BASE}/productos`).then(checked)
}
export function createProducto(data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${ADMIN}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
export function updateProducto(id: string, data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${ADMIN}/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
/** Rechaza con el motivo si tiene pedidos sin despachar: el panel lo muestra en la alerta. */
export function deleteProducto(id: string): Promise<void> {
  return fetch(`${ADMIN}/productos/${id}`, { method: 'DELETE' }).then(conMotivo).then(() => undefined)
}

// ── Aves ───────────────────────────────────────────────────
// Sin `idioma`: el panel recibe `alt` y `altEn` por separado.
export function getAvesAdmin(): Promise<AdminAve[]> {
  return fetch(`${BASE}/aves`, { cache: 'no-store' }).then(checked)
}
/** Un error con un motivo escrito por el backend, listo para mostrarse tal cual en el panel. */
export class ErrorConMotivo extends Error {}

/** A diferencia de `checked`, devuelve el motivo del backend: «ya hay una especie con ese nombre». */
async function conMotivo(r: Response) {
  if (r.ok) return r.json()
  const motivo = await r.json().then(
    (d: { message?: string | string[] }) => (Array.isArray(d.message) ? d.message.join('. ') : d.message),
    () => undefined,
  )
  throw motivo ? new ErrorConMotivo(motivo) : new Error(`API error ${r.status}`)
}
export function createAve(data: Partial<AdminAve>): Promise<AdminAve> {
  return fetch(`${ADMIN}/aves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(conMotivo)
}
export function updateAve(id: string, data: Partial<AdminAve>): Promise<AdminAve> {
  return fetch(`${ADMIN}/aves/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(conMotivo)
}
export function reordenarAves(ids: string[]): Promise<AdminAve[]> {
  return fetch(`${ADMIN}/aves/orden`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  }).then(conMotivo)
}
export function deleteAve(id: string): Promise<void> {
  return fetch(`${ADMIN}/aves/${id}`, { method: 'DELETE' }).then(checked).then(() => undefined)
}

// ── Pedidos ────────────────────────────────────────────────
export function getPedidos(): Promise<AdminPedido[]> {
  return fetch(`${ADMIN}/pedidos`).then(checked)
}
export function getPedido(id: string): Promise<AdminPedido> {
  return fetch(`${ADMIN}/pedidos/${id}`).then(checked)
}
/** Rechaza con el motivo si tiene pagos registrados: el panel lo muestra en la alerta. */
export function deletePedido(id: string): Promise<void> {
  return fetch(`${ADMIN}/pedidos/${id}`, { method: 'DELETE' }).then(conMotivo).then(() => undefined)
}
export function updateEstadoPedido(id: string, estado: EstadoPedido): Promise<AdminPedido> {
  return fetch(`${ADMIN}/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(conMotivo)
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

// ── Solicitudes de grupo ───────────────────────────────────
export function getSolicitudesGrupo(): Promise<AdminSolicitudGrupo[]> {
  return fetch(`${ADMIN}/solicitudes-grupo`).then(checked)
}
export function updateEstadoSolicitud(id: string, estado: EstadoSolicitud): Promise<AdminSolicitudGrupo> {
  return fetch(`${ADMIN}/solicitudes-grupo/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(conMotivo)
}
export function deleteSolicitudGrupo(id: string): Promise<void> {
  return fetch(`${ADMIN}/solicitudes-grupo/${id}`, { method: 'DELETE' })
    .then(checked)
    .then(() => undefined)
}

// ── Mensajes de contacto ───────────────────────────────────
export function getContactos(): Promise<AdminContacto[]> {
  return fetch(`${ADMIN}/contacto`).then(checked)
}
export function updateEstadoContacto(id: string, estado: EstadoContacto): Promise<AdminContacto> {
  return fetch(`${ADMIN}/contacto/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(conMotivo)
}
export function deleteContacto(id: string): Promise<void> {
  return fetch(`${ADMIN}/contacto/${id}`, { method: 'DELETE' })
    .then(checked)
    .then(() => undefined)
}

// ── SiteConfig ─────────────────────────────────────────────
// Por el puente y no contra `BASE`: trae el correo de alertas, que el
// `GET /site-config` público ya no entrega.
export function getSiteConfigAdmin(): Promise<Record<string, string>> {
  return fetch('/api/admin/site-config').then(checked)
}
export function patchSiteConfig(data: Record<string, string>): Promise<Record<string, string>> {
  return fetch('/api/admin/site-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}

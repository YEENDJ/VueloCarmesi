/**
 * Rutas de administración que el puente genérico (backend/[...ruta]) puede
 * reenviar, por método.
 *
 * Lista cerrada a propósito. Este puente le pone la clave de admin a lo que
 * reenvía, así que reenviar cualquier ruta convertiría una sesión del panel en
 * una llave maestra para rutas que ni siquiera existen hoy. Una ruta nueva del
 * panel se agrega aquí de forma explícita.
 */

export type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE'

const ID = '[A-Za-z0-9_-]+'

const PERMITIDAS: Record<Metodo, RegExp[]> = {
  GET: [
    /^reservas$/, new RegExp(`^reservas/${ID}$`),
    /^pedidos$/, new RegExp(`^pedidos/${ID}$`),
    /^solicitudes-grupo$/,
  ],
  POST: [/^experiencias$/, /^productos$/],
  PATCH: [
    new RegExp(`^reservas/${ID}$`), new RegExp(`^reservas/${ID}/estado$`),
    new RegExp(`^pedidos/${ID}$`),
    new RegExp(`^experiencias/${ID}$`), new RegExp(`^productos/${ID}$`),
    new RegExp(`^solicitudes-grupo/${ID}/estado$`),
  ],
  DELETE: [
    new RegExp(`^reservas/${ID}$`), new RegExp(`^pedidos/${ID}$`),
    new RegExp(`^experiencias/${ID}$`), new RegExp(`^productos/${ID}$`),
    new RegExp(`^solicitudes-grupo/${ID}$`),
  ],
}

export function rutaPermitida(metodo: Metodo, ruta: string): boolean {
  return PERMITIDAS[metodo].some(re => re.test(ruta))
}

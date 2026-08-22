import { NextRequest } from 'next/server'
import { BASE, comoLlego, sesionAdmin } from '../proxy'

/**
 * Guardar las opciones del sitio. El GET no pasa por aquí: es público en el
 * backend y el panel lo pide directo, como el resto de la web.
 */
export async function PATCH(req: NextRequest) {
  const sesion = await sesionAdmin()
  if (!sesion.ok) return sesion.respuesta

  const res = await fetch(`${BASE}/site-config`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie: sesion.cookie },
    body: await req.text(),
  })

  return comoLlego(res)
}

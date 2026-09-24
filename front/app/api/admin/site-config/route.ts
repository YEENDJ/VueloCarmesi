import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { BASE, comoLlego, sesionAdmin } from '../proxy'

/**
 * Leer las opciones con las claves privadas (el correo de alertas), que el
 * `GET /site-config` público ya no entrega.
 */
export async function GET() {
  const sesion = await sesionAdmin()
  if (!sesion.ok) return sesion.respuesta

  const res = await fetch(`${BASE}/site-config/admin`, {
    headers: sesion.headers,
    cache: 'no-store',
  })

  // TRANSICIÓN — borrar cuando Render tenga `GET /site-config/admin`. Si Vercel
  // publica antes, el backend viejo responde 404 y el panel se quedaría sin
  // configuración; el público todavía trae todas las claves.
  if (res.status === 404) {
    return comoLlego(await fetch(`${BASE}/site-config`, { cache: 'no-store' }))
  }

  return comoLlego(res)
}

/** Guardar las opciones del sitio. */
export async function PATCH(req: NextRequest) {
  const sesion = await sesionAdmin()
  if (!sesion.ok) return sesion.respuesta

  const res = await fetch(`${BASE}/site-config`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', ...sesion.headers },
    body: await req.text(),
  })

  // Sin esto, guardar desde el panel no se nota en la web hasta cinco minutos
  // después: `getSiteConfig` cachea con `revalidate: 300`, así que el sitio
  // sigue sirviendo el valor anterior aunque la base ya tenga el nuevo. Pasó
  // en producción con el aviso de cancelación.
  //
  // Una sola llamada cubre los dos idiomas: español e inglés son dos URLs
  // distintas —/site-config y /site-config?idioma=en— pero comparten la
  // etiqueta, y la invalidación va por etiqueta, no por URL.
  //
  // Solo si el backend aceptó: un guardado rechazado no cambió nada y tirar la
  // caché por él solo obliga a rehacer la petición para nada.
  if (res.ok) {
    // El segundo argumento no es opcional aunque el tipo lo admita: la forma de
    // un solo argumento está obsoleta y puede desaparecer. Con 'max' la entrada
    // queda marcada como vieja y se sirve mientras se busca la nueva por
    // detrás, así que la primera visita después de guardar todavía puede ver el
    // valor anterior —una, no cinco minutos—. Lo que evita esa visita es
    // `updateTag`, pero solo existe dentro de Server Actions y esto es un Route
    // Handler; convertirlo es un cambio mayor que este arreglo no justifica.
    revalidateTag('site-config', 'max')
  }

  return comoLlego(res)
}

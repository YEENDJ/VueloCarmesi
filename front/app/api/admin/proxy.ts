import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { COOKIE_SESION, sesionValida } from '@/lib/admin/sesion'

/**
 * Puente entre el panel y las rutas del backend que exigen sesión de admin.
 *
 * Existe por una razón concreta: la cookie `admin_session` la pone este mismo
 * front (ver app/api/admin/login/route.ts) y va sin atributo `domain`, así que
 * es host-only. El navegador la manda solo a peticiones dirigidas a este host,
 * y el backend vive en otro dominio en producción. Cuando el panel llamaba
 * directo al backend, la cookie no viajaba, el AdminGuard no la encontraba y
 * todo respondía 401 — subir foto, borrarla y guardar Configuración.
 *
 * En local no se notaba: front en localhost:3000 y backend en localhost:3001.
 * Las cookies ignoran el puerto, así que para el navegador es el mismo host y
 * la cookie sí viajaba. Era el único motivo por el que llegó a funcionar.
 *
 * `SameSite=None` no lo arreglaba: ese atributo decide si una cookie del
 * destino viaja en contexto cross-site, no hace que la cookie de un dominio se
 * envíe a otro.
 *
 * Con el puente, el navegador habla siempre con su propio origen —donde la
 * cookie sí está— y el reenvío al backend ocurre de servidor a servidor.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Comprueba la sesión y devuelve las cabeceras con las que hablarle al
 * backend, o la respuesta 401 si no hay sesión. Quien manda es esta
 * comprobación: se hace en el servidor que emitió y firmó la cookie.
 *
 * Al backend no le llega la sesión sino `x-admin-key`, una clave que solo
 * tienen este servidor y el de Render. El navegador nunca la ve, así que la
 * única forma de llegar a una ruta de administración es pasar por aquí, y aquí
 * primero se valida la firma.
 */
export async function sesionAdmin(): Promise<
  { ok: true; headers: Record<string, string> } | { ok: false; respuesta: NextResponse }
> {
  const token = (await cookies()).get(COOKIE_SESION)?.value
  const clave = process.env.ADMIN_API_KEY

  if (!sesionValida(token)) {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { message: 'Tu sesión de administrador expiró. Vuelve a entrar.' },
        { status: 401 },
      ),
    }
  }

  if (!clave) {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { message: 'El panel no está configurado: falta ADMIN_API_KEY en el servidor.' },
        { status: 500 },
      ),
    }
  }

  return {
    ok: true,
    headers: { 'x-admin-key': clave },
  }
}

/**
 * Devuelve la respuesta del backend tal cual la dio: mismo estado y mismo
 * cuerpo. El backend explica por qué rechaza una foto —el peso, el formato, el
 * caso del HEIC de iPhone— y ese texto es lo único que quien sube puede
 * accionar, así que el puente no lo puede tragar ni reescribir.
 */
export async function comoLlego(res: Response): Promise<NextResponse> {
  const cuerpo = await res.text()

  return new NextResponse(cuerpo, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  })
}

export { BASE }

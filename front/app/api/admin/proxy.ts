import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
 * Comprueba la sesión y devuelve la cabecera Cookie con la que hablarle al
 * backend, o la respuesta 401 si no hay sesión. Quien manda es esta
 * comprobación: se hace en el servidor que emitió la cookie.
 */
export async function sesionAdmin(): Promise<
  { ok: true; cookie: string } | { ok: false; respuesta: NextResponse }
> {
  const session = (await cookies()).get('admin_session')

  if (session?.value !== 'authenticated') {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { message: 'Tu sesión de administrador expiró. Vuelve a entrar.' },
        { status: 401 },
      ),
    }
  }

  return { ok: true, cookie: `admin_session=${session.value}` }
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

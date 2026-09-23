// Solo servidor: `node:crypto` no existe en el navegador, así que importar esto
// desde un componente cliente rompe la compilación, que es lo que se quiere.
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * La sesión del panel, firmada.
 *
 * Antes la cookie valía siempre la palabra `authenticated` y bastaba con que
 * existiera: cualquiera podía escribirla a mano y entrar como administrador.
 * Ahora lleva la fecha de vencimiento y una firma HMAC de esa fecha con
 * `ADMIN_SESSION_SECRET`, que solo conoce este servidor. Sin el secreto no se
 * puede fabricar una cookie válida, ni alargar una vieja cambiándole la fecha.
 *
 * Formato: `v1.<vence en ms>.<firma base64url>`. El `v1` deja cambiar el
 * esquema algún día sin confundir un formato con otro.
 */

export const COOKIE_SESION = 'admin_session'
export const DURACION_SESION_S = 60 * 60 * 24 * 7 // 7 días

function secreto(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  // Sin secreto no hay sesión posible: se falla cerrado. Un secreto vacío o
  // corto firmaría cookies que cualquiera puede reproducir.
  if (!s || s.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET falta o tiene menos de 32 caracteres')
  }
  return s
}

const firmar = (datos: string) => createHmac('sha256', secreto()).update(datos).digest('base64url')

export function crearSesion(ahora = Date.now()): string {
  const datos = `v1.${ahora + DURACION_SESION_S * 1000}`
  return `${datos}.${firmar(datos)}`
}

/** true solo si la firma es de este servidor y la sesión no ha vencido. */
export function sesionValida(token: string | undefined, ahora = Date.now()): boolean {
  if (!token) return false
  const partes = token.split('.')
  if (partes.length !== 3 || partes[0] !== 'v1') return false

  const vence = Number(partes[1])
  if (!Number.isFinite(vence) || vence <= ahora) return false

  let esperada: Buffer
  try {
    esperada = Buffer.from(firmar(`v1.${partes[1]}`))
  } catch {
    return false // sin secreto configurado, ninguna sesión vale
  }
  const recibida = Buffer.from(partes[2])
  // timingSafeEqual exige el mismo largo; compararlo antes no filtra nada útil
  // porque el largo de una firma HMAC-SHA256 en base64url es fijo y público.
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
}

/** Compara la contraseña del login sin delatar por el tiempo cuántos caracteres acertó. */
export function contrasenaCorrecta(intento: unknown): boolean {
  const real = process.env.ADMIN_PASSWORD
  if (!real || typeof intento !== 'string') return false
  // Se comparan las firmas y no los textos: así los dos lados miden lo mismo
  // aunque la contraseña intentada tenga otro largo.
  const h = (s: string) => createHmac('sha256', 'login').update(s).digest()
  return timingSafeEqual(h(intento), h(real))
}

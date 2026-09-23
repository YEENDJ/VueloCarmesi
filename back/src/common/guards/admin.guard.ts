import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { createHash, timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'

/**
 * Deja pasar solo al servidor del front.
 *
 * Antes miraba la cookie `admin_session=authenticated`, que cualquiera podía
 * escribir a mano desde cualquier lado. Ahora exige `x-admin-key` con el valor
 * de `ADMIN_API_KEY`, una clave que solo tienen este servidor y el de Vercel:
 * el navegador nunca la ve, porque el panel habla con el puente de
 * front/app/api/admin/ y es el puente el que la pone, después de validar la
 * sesión firmada.
 *
 * Sin `ADMIN_API_KEY` configurada no pasa nadie: una clave vacía coincidiría
 * con una cabecera vacía. La clave se lee de `.env` al arrancar, así que
 * cambiarla exige reiniciar el proceso.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name)

  canActivate(context: ExecutionContext): boolean {
    const esperada = process.env.ADMIN_API_KEY
    if (!esperada || esperada.length < 32) {
      this.logger.error('ADMIN_API_KEY falta o tiene menos de 32 caracteres: se rechaza toda ruta de admin')
      throw new UnauthorizedException()
    }

    const recibida = context.switchToHttp().getRequest<Request>().headers['x-admin-key']
    if (typeof recibida !== 'string' || !iguales(recibida, esperada)) {
      throw new UnauthorizedException()
    }
    return true
  }
}

/**
 * Comparación en tiempo constante. Se comparan los hashes y no los textos
 * porque timingSafeEqual exige el mismo largo, y cortar antes por el largo le
 * diría a quien prueba cuántos caracteres tiene la clave.
 */
function iguales(a: string, b: string): boolean {
  const h = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(h(a), h(b))
}

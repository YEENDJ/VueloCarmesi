import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()
    const cookieHeader = req.headers.cookie ?? ''
    const cookies = Object.fromEntries(
      cookieHeader
        .split(';')
        .map(c => c.trim())
        .filter(Boolean)
        .map(c => {
          const idx = c.indexOf('=')
          return [
            decodeURIComponent(c.slice(0, idx).trim()),
            decodeURIComponent(c.slice(idx + 1).trim()),
          ]
        }),
    )
    if (cookies['admin_session'] !== 'authenticated') {
      throw new UnauthorizedException()
    }
    return true
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthConfigService } from './auth-config.service'
import type { RequestConSesion, SesionPayload } from './sesion.types'

/**
 * Guard de autenticación: lee el JWT de la cookie httpOnly, lo verifica y
 * adjunta el usuario (con su `sucursalId`) a la request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AuthConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestConSesion>()
    const cookies = req.cookies as Record<string, string> | undefined
    const token = cookies?.[this.config.cookieName]

    if (!token) {
      throw new UnauthorizedException('No hay sesión iniciada')
    }

    try {
      const payload = await this.jwt.verifyAsync<SesionPayload>(token)
      req.usuario = {
        id: payload.sub,
        email: payload.email,
        sucursalId: payload.sucursalId ?? null,
      }
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada')
    }

    return true
  }
}

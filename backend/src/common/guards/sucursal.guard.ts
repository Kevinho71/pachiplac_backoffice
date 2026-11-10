import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import type { RequestConSesion } from '../../auth/sesion.types'

/**
 * Exige que la sesión tenga una sucursal activa. Se usa **después** de
 * `AuthGuard` (que adjunta `req.usuario`). Es la base del aislamiento
 * multitenant: sin sucursal activa no se puede tocar catálogo ni inventario.
 */
@Injectable()
export class SucursalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestConSesion>()
    if (!req.usuario) {
      throw new UnauthorizedException('No hay sesión iniciada')
    }
    if (req.usuario.sucursalId === null) {
      throw new BadRequestException('Elegí una sucursal activa para continuar')
    }
    return true
  }
}

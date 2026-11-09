import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { RequestConSesion, UsuarioSesion } from './sesion.types'

/** Inyecta el usuario autenticado (adjuntado por el guard) en un handler. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioSesion | undefined => {
    const req = context.switchToHttp().getRequest<RequestConSesion>()
    return req.usuario
  },
)

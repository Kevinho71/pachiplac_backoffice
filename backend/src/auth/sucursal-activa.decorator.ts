import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { RequestConSesion } from './sesion.types'

/**
 * Inyecta el id de la sucursal activa de la sesión (o `null` si no se eligió).
 * Es la base del aislamiento multitenant: el id siempre viene de la sesión,
 * nunca del cuerpo de la petición (sección 13).
 */
export const SucursalActiva = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number | null => {
    const req = context.switchToHttp().getRequest<RequestConSesion>()
    return req.usuario?.sucursalId ?? null
  },
)

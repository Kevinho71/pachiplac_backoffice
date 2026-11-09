import type { Request } from 'express'

/** Payload del JWT de sesión. */
export interface SesionPayload {
  /** Id del usuario (claim estándar `sub`). */
  sub: number
  email: string
  /** Sucursal activa; `null` si todavía no se eligió. Base del aislamiento multitenant. */
  sucursalId: number | null
}

/** Usuario autenticado adjuntado a la request por el guard. */
export interface UsuarioSesion {
  id: number
  email: string
  sucursalId: number | null
}

/** Request HTTP con la sesión adjuntada por {@link AuthGuard}. */
export interface RequestConSesion extends Request {
  usuario?: UsuarioSesion
}

import type { Sucursal } from '@pachiplac/shared'

export type { Sucursal }

export interface UsuarioSesion {
  id: number
  email: string
}

/** Respuesta de `GET /auth/sesion`. */
export interface Sesion {
  usuario: UsuarioSesion
  sucursalId: number | null
}

export interface LoginResponse {
  usuario: UsuarioSesion
}

import { Injectable } from '@nestjs/common'

const DEV_JWT_SECRET = 'pachiplac-dev-secret-cambiar-en-produccion'

/**
 * Configuración de autenticación leída de las variables de entorno.
 * En producción exige un `JWT_SECRET` propio; en desarrollo usa un valor por
 * defecto para poder levantar sin configurar nada (fail-fast en producción).
 */
@Injectable()
export class AuthConfigService {
  readonly jwtSecret: string
  readonly jwtExpiresIn: string
  readonly cookieName: string
  readonly cookieSecure: boolean
  readonly cookieSameSite: 'lax' | 'strict' | 'none'
  readonly cookieMaxAgeMs: number

  constructor() {
    const esProduccion = (process.env.NODE_ENV ?? 'development') === 'production'
    const jwtSecret = process.env.JWT_SECRET?.trim()
    if (!jwtSecret && esProduccion) {
      throw new Error('JWT_SECRET es obligatorio en producción')
    }

    this.jwtSecret = jwtSecret || DEV_JWT_SECRET
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d'
    this.cookieName = process.env.COOKIE_NAME ?? 'pachiplac_session'
    this.cookieSecure = (process.env.COOKIE_SECURE ?? 'false') === 'true'
    this.cookieSameSite = 'lax'
    // Mantener en sintonía con JWT_EXPIRES_IN (7 días por defecto).
    this.cookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000
  }
}

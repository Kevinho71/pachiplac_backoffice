import { Injectable } from '@nestjs/common'
import type { CookieOptions, Response } from 'express'
import { AuthConfigService } from './auth-config.service'

/**
 * Escribe/borra la cookie de sesión httpOnly con los flags de seguridad
 * (`Secure` + `SameSite`, ver sección 13 de la especificación).
 */
@Injectable()
export class SesionCookieService {
  constructor(private readonly config: AuthConfigService) {}

  emitir(res: Response, token: string): void {
    res.cookie(this.config.cookieName, token, this.opciones())
  }

  limpiar(res: Response): void {
    res.clearCookie(this.config.cookieName, this.opciones())
  }

  private opciones(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: this.config.cookieSameSite,
      maxAge: this.config.cookieMaxAgeMs,
      path: '/',
    }
  }
}

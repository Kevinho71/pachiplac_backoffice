import { Body, Controller, Post, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { loginInputSchema, type LoginInput, type LoginResponse } from '@pachiplac/shared'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { AuthService } from './auth.service'
import { SesionCookieService } from './sesion-cookie.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sesionCookie: SesionCookieService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginInputSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const { usuario, token } = await this.auth.login(body.email, body.password)
    this.sesionCookie.emitir(res, token)
    return { usuario }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    this.sesionCookie.limpiar(res)
    return { ok: true }
  }
}

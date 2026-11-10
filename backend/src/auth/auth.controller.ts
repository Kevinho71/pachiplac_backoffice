import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { loginInputSchema, type LoginInput, type LoginResponse } from '@pachiplac/shared'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { SesionCookieService } from './sesion-cookie.service'
import type { UsuarioSesion } from './sesion.types'
import { UsuarioActual } from './usuario-actual.decorator'

export interface SesionResponse {
  usuario: { id: number; email: string }
  sucursalId: number | null
}

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

  /** Devuelve la sesión actual (usuario y sucursal activa) a partir de la cookie. */
  @Get('sesion')
  @UseGuards(AuthGuard)
  sesion(@UsuarioActual() usuario: UsuarioSesion | undefined): SesionResponse {
    if (!usuario) {
      throw new UnauthorizedException('No hay sesión iniciada')
    }
    return { usuario: { id: usuario.id, email: usuario.email }, sucursalId: usuario.sucursalId }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    this.sesionCookie.limpiar(res)
    return { ok: true }
  }
}

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import type { Sucursal } from '@pachiplac/shared'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { AuthGuard } from '../auth/auth.guard'
import { AuthService } from '../auth/auth.service'
import { SesionCookieService } from '../auth/sesion-cookie.service'
import type { UsuarioSesion } from '../auth/sesion.types'
import { UsuarioActual } from '../auth/usuario-actual.decorator'
import { SucursalesService } from './sucursales.service'
import { seleccionarSucursalSchema, type SeleccionarSucursal } from './dto'

export interface SucursalActivaResponse {
  sucursalId: number
}

@Controller('sucursales')
export class SucursalesController {
  constructor(
    private readonly sucursales: SucursalesService,
    private readonly auth: AuthService,
    private readonly sesionCookie: SesionCookieService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async listar(): Promise<Sucursal[]> {
    return this.sucursales.listar()
  }

  /** Fija la sucursal activa re-firmando el JWT de la sesión con su `sucursalId`. */
  @Post('activa')
  @UseGuards(AuthGuard)
  async activar(
    @Body(new ZodValidationPipe(seleccionarSucursalSchema)) body: SeleccionarSucursal,
    @UsuarioActual() usuario: UsuarioSesion | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SucursalActivaResponse> {
    if (!usuario) {
      throw new UnauthorizedException('No hay sesión iniciada')
    }

    const existe = await this.sucursales.existeActiva(body.sucursalId)
    if (!existe) {
      throw new NotFoundException('Sucursal no encontrada o inactiva')
    }

    const token = await this.auth.firmarConSucursal(
      { id: usuario.id, email: usuario.email },
      body.sucursalId,
    )
    this.sesionCookie.emitir(res, token)

    return { sucursalId: body.sucursalId }
  }
}

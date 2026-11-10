import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common'

import { laminaUpdateSchema, type LaminaUpdate } from '@pachiplac/shared'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { LaminasService } from './laminas.service'
import type { LaminaDetalle } from './laminas.types'

@Controller('laminas')
@UseGuards(AuthGuard, SucursalGuard)
export class LaminasController {
  constructor(private readonly laminas: LaminasService) {}

  @Get()
  listar(@SucursalRequerida() sucursalId: number): Promise<LaminaDetalle[]> {
    return this.laminas.listar(sucursalId)
  }

  @Get(':productoId')
  obtener(
    @SucursalRequerida() sucursalId: number,
    @Param('productoId', ParseIntPipe) productoId: number,
  ): Promise<LaminaDetalle> {
    return this.laminas.obtener(sucursalId, productoId)
  }

  @Patch(':productoId')
  actualizar(
    @SucursalRequerida() sucursalId: number,
    @Param('productoId', ParseIntPipe) productoId: number,
    @Body(new ZodValidationPipe(laminaUpdateSchema)) body: LaminaUpdate,
  ): Promise<LaminaDetalle> {
    return this.laminas.actualizar(sucursalId, productoId, body)
  }
}

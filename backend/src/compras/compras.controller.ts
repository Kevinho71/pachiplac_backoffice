import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'

import { compraInputSchema, type CompraInput } from '@pachiplac/shared'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { ComprasService } from './compras.service'
import type { CompraDetalle } from './compras.types'
import { listarComprasQuerySchema, type ListarComprasQuery } from './dto'

@Controller('compras')
@UseGuards(AuthGuard, SucursalGuard)
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get()
  listar(
    @SucursalRequerida() sucursalId: number,
    @Query(new ZodValidationPipe(listarComprasQuerySchema)) query: ListarComprasQuery,
  ): Promise<CompraDetalle[]> {
    return this.compras.listar(sucursalId, query)
  }

  @Post()
  crear(
    @SucursalRequerida() sucursalId: number,
    @Body(new ZodValidationPipe(compraInputSchema)) body: CompraInput,
  ): Promise<CompraDetalle> {
    return this.compras.crear(sucursalId, body)
  }
}

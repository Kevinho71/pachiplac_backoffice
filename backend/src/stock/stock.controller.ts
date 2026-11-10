import { Controller, Get, UseGuards } from '@nestjs/common'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { StockService } from './stock.service'
import type { StockDetalle } from './stock.types'

@Controller('stock')
@UseGuards(AuthGuard, SucursalGuard)
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  listar(@SucursalRequerida() sucursalId: number): Promise<StockDetalle[]> {
    return this.stock.listar(sucursalId)
  }
}

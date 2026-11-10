import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import {
  ingresoExtraInputSchema,
  type IngresoExtra,
  type IngresoExtraInput,
} from '@pachiplac/shared'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  actualizarIngresoExtraSchema,
  listarIngresosExtraQuerySchema,
  type ActualizarIngresoExtraInput,
  type ListarIngresosExtraQuery,
} from './dto'
import { IngresosExtraService } from './ingresos-extra.service'

@Controller('ingresos-extra')
@UseGuards(AuthGuard, SucursalGuard)
export class IngresosExtraController {
  constructor(private readonly ingresos: IngresosExtraService) {}

  @Get()
  listar(
    @SucursalRequerida() sucursalId: number,
    @Query(new ZodValidationPipe(listarIngresosExtraQuerySchema))
    query: ListarIngresosExtraQuery,
  ): Promise<IngresoExtra[]> {
    return this.ingresos.listar(sucursalId, query)
  }

  @Get(':id')
  obtener(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
  ): Promise<IngresoExtra> {
    return this.ingresos.obtener(sucursalId, Number(id))
  }

  @Post()
  crear(
    @SucursalRequerida() sucursalId: number,
    @Body(new ZodValidationPipe(ingresoExtraInputSchema)) body: IngresoExtraInput,
  ): Promise<IngresoExtra> {
    return this.ingresos.crear(sucursalId, body)
  }

  @Patch(':id')
  actualizar(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarIngresoExtraSchema)) body: ActualizarIngresoExtraInput,
  ): Promise<IngresoExtra> {
    return this.ingresos.actualizar(sucursalId, Number(id), body)
  }

  @Delete(':id')
  eliminar(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.ingresos.eliminar(sucursalId, Number(id))
  }
}

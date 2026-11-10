import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import type { PrecioHistorial } from '@pachiplac/shared'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  actualizarProductoSchema,
  crearProductoSchema,
  listarProductosQuerySchema,
  nuevoPrecioSchema,
  type ActualizarProductoInput,
  type CrearProductoInput,
  type ListarProductosQuery,
  type NuevoPrecioInput,
} from './dto'
import type { ProductoDetalle } from './producto.types'
import { ProductosService } from './productos.service'

@Controller('productos')
@UseGuards(AuthGuard, SucursalGuard)
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get()
  listar(
    @SucursalRequerida() sucursalId: number,
    @Query(new ZodValidationPipe(listarProductosQuerySchema)) query: ListarProductosQuery,
  ): Promise<ProductoDetalle[]> {
    return this.productos.listar(sucursalId, query)
  }

  @Get(':id')
  obtener(
    @SucursalRequerida() sucursalId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductoDetalle> {
    return this.productos.obtener(sucursalId, id)
  }

  @Post()
  crear(
    @SucursalRequerida() sucursalId: number,
    @Body(new ZodValidationPipe(crearProductoSchema)) body: CrearProductoInput,
  ): Promise<ProductoDetalle> {
    return this.productos.crear(sucursalId, body)
  }

  @Patch(':id')
  actualizar(
    @SucursalRequerida() sucursalId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(actualizarProductoSchema)) body: ActualizarProductoInput,
  ): Promise<ProductoDetalle> {
    return this.productos.actualizar(sucursalId, id, body)
  }

  /** Baja lógica del producto (no se borra para conservar el historial). */
  @Delete(':id')
  desactivar(
    @SucursalRequerida() sucursalId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductoDetalle> {
    return this.productos.desactivar(sucursalId, id)
  }

  @Get(':id/precios')
  listarPrecios(
    @SucursalRequerida() sucursalId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PrecioHistorial[]> {
    return this.productos.listarPrecios(sucursalId, id)
  }

  @Post(':id/precios')
  crearPrecio(
    @SucursalRequerida() sucursalId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(nuevoPrecioSchema)) body: NuevoPrecioInput,
  ): Promise<PrecioHistorial> {
    return this.productos.crearPrecio(sucursalId, id, body)
  }
}

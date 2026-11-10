import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  actualizarEntregadoSchema,
  actualizarEsquemaSchema,
  actualizarSaldoSchema,
  crearVentaSchema,
  documentoQuerySchema,
  listarVentasQuerySchema,
  type ActualizarEntregadoInput,
  type ActualizarEsquemaInput,
  type ActualizarSaldoInput,
  type CrearVentaInput,
  type DocumentoQuery,
  type ListarVentasQuery,
} from './dto'
import { VentasService } from './ventas.service'
import type { DocumentoImpresion, VentaDetalle, VentaResumen } from './ventas.types'

@Controller('ventas')
@UseGuards(AuthGuard, SucursalGuard)
export class VentasController {
  constructor(private readonly ventas: VentasService) {}

  @Get()
  listar(
    @SucursalRequerida() sucursalId: number,
    @Query(new ZodValidationPipe(listarVentasQuerySchema)) query: ListarVentasQuery,
  ): Promise<VentaResumen[]> {
    return this.ventas.listar(sucursalId, query)
  }

  @Post()
  crear(
    @SucursalRequerida() sucursalId: number,
    @Body(new ZodValidationPipe(crearVentaSchema)) body: CrearVentaInput,
  ): Promise<VentaDetalle> {
    return this.ventas.crear(sucursalId, body)
  }

  @Get(':id/imprimir')
  imprimir(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(documentoQuerySchema)) query: DocumentoQuery,
  ): Promise<DocumentoImpresion> {
    return this.ventas.documentoImpresion(sucursalId, Number(id), query.tipo)
  }

  @Get(':id')
  obtener(@SucursalRequerida() sucursalId: number, @Param('id') id: string): Promise<VentaDetalle> {
    return this.ventas.obtener(sucursalId, Number(id))
  }

  @Patch(':id/saldo')
  actualizarSaldo(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarSaldoSchema)) body: ActualizarSaldoInput,
  ): Promise<VentaDetalle> {
    return this.ventas.actualizarSaldo(sucursalId, Number(id), body)
  }

  @Patch(':id/entregado')
  actualizarEntregado(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarEntregadoSchema)) body: ActualizarEntregadoInput,
  ): Promise<VentaDetalle> {
    return this.ventas.actualizarEntregado(sucursalId, Number(id), body)
  }

  @Put(':id/esquema')
  actualizarEsquema(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(actualizarEsquemaSchema)) body: ActualizarEsquemaInput,
  ): Promise<VentaDetalle> {
    return this.ventas.actualizarEsquema(sucursalId, Number(id), body)
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'

import {
  clienteInputSchema,
  clienteUpdateSchema,
  type Cliente,
  type ClienteInput,
  type ClienteUpdate,
} from '@pachiplac/shared'

import { AuthGuard } from '../auth/auth.guard'
import { SucursalRequerida } from '../auth/sucursal-activa.decorator'
import { SucursalGuard } from '../common/guards/sucursal.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { ClientesService } from './clientes.service'
import { listarClientesQuerySchema, type ListarClientesQuery } from './dto'

@Controller('clientes')
@UseGuards(AuthGuard, SucursalGuard)
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  listar(
    @SucursalRequerida() sucursalId: number,
    @Query(new ZodValidationPipe(listarClientesQuerySchema)) query: ListarClientesQuery,
  ): Promise<Cliente[]> {
    return this.clientes.listar(sucursalId, query)
  }

  @Get(':id')
  obtener(@SucursalRequerida() sucursalId: number, @Param('id') id: string): Promise<Cliente> {
    return this.clientes.obtener(sucursalId, Number(id))
  }

  @Post()
  crear(
    @SucursalRequerida() sucursalId: number,
    @Body(new ZodValidationPipe(clienteInputSchema)) body: ClienteInput,
  ): Promise<Cliente> {
    return this.clientes.crear(sucursalId, body)
  }

  @Patch(':id')
  actualizar(
    @SucursalRequerida() sucursalId: number,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(clienteUpdateSchema)) body: ClienteUpdate,
  ): Promise<Cliente> {
    return this.clientes.actualizar(sucursalId, Number(id), body)
  }
}

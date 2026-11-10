import { Injectable, NotFoundException } from '@nestjs/common'

import type { Cliente, ClienteInput, ClienteUpdate } from '@pachiplac/shared'

import { PrismaService } from '../prisma/prisma.service'
import type { ListarClientesQuery } from './dto'

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(sucursalId: number, filtros: ListarClientesQuery): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({
      where: {
        sucursalId,
        ...(filtros.q ? { nombre: { contains: filtros.q, mode: 'insensitive' } } : {}),
      },
      orderBy: { nombre: 'asc' },
    })

    return clientes.map((cliente) => this.aDetalle(cliente))
  }

  async obtener(sucursalId: number, id: number): Promise<Cliente> {
    const cliente = await this.prisma.cliente.findFirst({ where: { id, sucursalId } })
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado en la sucursal activa')
    }
    return this.aDetalle(cliente)
  }

  async crear(sucursalId: number, input: ClienteInput): Promise<Cliente> {
    const cliente = await this.prisma.cliente.create({
      data: {
        sucursalId,
        nombre: input.nombre,
        telefono: input.telefono ?? null,
      },
    })
    return this.aDetalle(cliente)
  }

  async actualizar(sucursalId: number, id: number, input: ClienteUpdate): Promise<Cliente> {
    await this.obtener(sucursalId, id)

    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: {
        ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
        ...(input.telefono !== undefined ? { telefono: input.telefono ?? null } : {}),
      },
    })
    return this.aDetalle(cliente)
  }

  private aDetalle(cliente: {
    id: number
    sucursalId: number
    nombre: string
    telefono: string | null
  }): Cliente {
    return {
      id: cliente.id,
      sucursal_id: cliente.sucursalId,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
    }
  }
}

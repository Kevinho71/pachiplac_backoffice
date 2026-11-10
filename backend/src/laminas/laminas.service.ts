import { Injectable, NotFoundException } from '@nestjs/common'

import type { LaminaUpdate } from '@pachiplac/shared'

import { PrismaService } from '../prisma/prisma.service'
import type { LaminaDetalle } from './laminas.types'

@Injectable()
export class LaminasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(sucursalId: number): Promise<LaminaDetalle[]> {
    const laminas = await this.prisma.lamina.findMany({
      where: { producto: { sucursalId } },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            unidadVenta: true,
            activo: true,
          },
        },
      },
      orderBy: { productoId: 'asc' },
    })
    return laminas.map((lamina) => this.aDetalle(lamina))
  }

  async obtener(sucursalId: number, productoId: number): Promise<LaminaDetalle> {
    const lamina = await this.prisma.lamina.findFirst({
      where: { productoId, producto: { sucursalId } },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
            unidadVenta: true,
            activo: true,
          },
        },
      },
    })
    if (!lamina) {
      throw new NotFoundException('Lámina no encontrada en la sucursal activa')
    }
    return this.aDetalle(lamina)
  }

  async actualizar(
    sucursalId: number,
    productoId: number,
    input: LaminaUpdate,
  ): Promise<LaminaDetalle> {
    await this.obtener(sucursalId, productoId)
    await this.prisma.lamina.update({
      where: { productoId },
      data: {
        ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
        ...(input.color !== undefined ? { color: input.color ?? null } : {}),
        ...(input.espesor_mm !== undefined ? { espesorMm: input.espesor_mm } : {}),
        ...(input.largo_mm !== undefined ? { largoMm: input.largo_mm } : {}),
        ...(input.ancho_mm !== undefined ? { anchoMm: input.ancho_mm } : {}),
        ...(input.tiene_veta !== undefined ? { tieneVeta: input.tiene_veta } : {}),
      },
    })
    return this.obtener(sucursalId, productoId)
  }

  private aDetalle(lamina: {
    productoId: number
    tipo: string
    color: string | null
    espesorMm: number
    largoMm: number
    anchoMm: number
    tieneVeta: boolean
    producto: {
      id: number
      nombre: string
      categoria: LaminaDetalle['producto']['categoria']
      unidadVenta: LaminaDetalle['producto']['unidad_venta']
      activo: boolean
    }
  }): LaminaDetalle {
    return {
      producto_id: lamina.productoId,
      tipo: lamina.tipo,
      color: lamina.color,
      espesor_mm: lamina.espesorMm,
      largo_mm: lamina.largoMm,
      ancho_mm: lamina.anchoMm,
      tiene_veta: lamina.tieneVeta,
      producto: {
        id: lamina.producto.id,
        nombre: lamina.producto.nombre,
        categoria: lamina.producto.categoria,
        unidad_venta: lamina.producto.unidadVenta,
        activo: lamina.producto.activo,
      },
    }
  }
}

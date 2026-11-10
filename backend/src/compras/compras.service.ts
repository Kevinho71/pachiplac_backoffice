import { Injectable, NotFoundException } from '@nestjs/common'

import { aDecimal, dinero, type CompraInput } from '@pachiplac/shared'

import { PrismaService } from '../prisma/prisma.service'
import type { ListarComprasQuery } from './dto'
import type { CompraDetalle } from './compras.types'

interface CompraConProducto {
  id: number
  sucursalId: number
  productoId: number
  fecha: Date
  cantidad: number
  costoTotal: { toFixed(decimales: number): string }
  producto: {
    id: number
    nombre: string
    categoria: CompraDetalle['producto']['categoria']
    unidadVenta: CompraDetalle['producto']['unidad_venta']
  }
}

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(sucursalId: number, filtros: ListarComprasQuery): Promise<CompraDetalle[]> {
    const rangoFechas = {
      ...(filtros.desde ? { gte: new Date(`${filtros.desde}T00:00:00.000Z`) } : {}),
      ...(filtros.hasta ? { lte: new Date(`${filtros.hasta}T23:59:59.999Z`) } : {}),
    }

    const compras = await this.prisma.compra.findMany({
      where: {
        sucursalId,
        ...(filtros.productoId ? { productoId: filtros.productoId } : {}),
        ...(Object.keys(rangoFechas).length > 0 ? { fecha: rangoFechas } : {}),
      },
      include: {
        producto: {
          select: { id: true, nombre: true, categoria: true, unidadVenta: true },
        },
      },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    })

    return compras.map((compra) => this.aDetalle(compra))
  }

  async crear(sucursalId: number, input: CompraInput): Promise<CompraDetalle> {
    const producto = await this.prisma.producto.findFirst({
      where: { id: input.producto_id, sucursalId },
      select: { id: true },
    })
    if (!producto) {
      throw new NotFoundException('Producto no encontrado en la sucursal activa')
    }

    const compra = await this.prisma.compra.create({
      data: {
        sucursalId,
        productoId: input.producto_id,
        ...(input.fecha ? { fecha: new Date(`${input.fecha}T00:00:00.000Z`) } : {}),
        cantidad: input.cantidad,
        costoTotal: input.costo_total,
      },
      include: {
        producto: {
          select: { id: true, nombre: true, categoria: true, unidadVenta: true },
        },
      },
    })

    return this.aDetalle(compra)
  }

  private aDetalle(compra: CompraConProducto): CompraDetalle {
    const costoTotal = compra.costoTotal.toFixed(2)
    return {
      id: compra.id,
      sucursal_id: compra.sucursalId,
      producto_id: compra.productoId,
      fecha: compra.fecha.toISOString().slice(0, 10),
      cantidad: compra.cantidad,
      costo_total: costoTotal,
      // Mismo cálculo que la columna generada: round(costo_total / cantidad, 2).
      costo_unitario: dinero(aDecimal(costoTotal).div(compra.cantidad)),
      producto: {
        id: compra.producto.id,
        nombre: compra.producto.nombre,
        categoria: compra.producto.categoria,
        unidad_venta: compra.producto.unidadVenta,
      },
    }
  }
}

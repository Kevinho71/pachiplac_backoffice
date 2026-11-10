import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import type { StockDetalle } from './stock.types'

interface StockRow {
  producto_id: number
  stock: number | string
  nombre: string
  categoria: StockDetalle['categoria']
  unidad_venta: StockDetalle['unidad_venta']
  unidades_por_compra: number
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lee la vista `stock` (compras − ventas) de la sucursal activa. La vista es la
   * fuente de verdad y no puede desincronizarse (sección 5.3).
   */
  async listar(sucursalId: number): Promise<StockDetalle[]> {
    const filas = await this.prisma.$queryRaw<StockRow[]>`
      SELECT s.producto_id,
             s.stock,
             p.nombre,
             p.categoria::text      AS categoria,
             p.unidad_venta::text   AS unidad_venta,
             p.unidades_por_compra
      FROM stock s
      JOIN productos p ON p.id = s.producto_id
      WHERE s.sucursal_id = ${sucursalId}
      ORDER BY p.nombre ASC
    `

    return filas.map((fila) => ({
      producto_id: Number(fila.producto_id),
      nombre: fila.nombre,
      categoria: fila.categoria,
      unidad_venta: fila.unidad_venta,
      unidades_por_compra: Number(fila.unidades_por_compra),
      stock: Number(fila.stock),
    }))
  }
}

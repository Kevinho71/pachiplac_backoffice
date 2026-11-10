import { Injectable, NotFoundException } from '@nestjs/common'

import type { IngresoExtra, IngresoExtraInput } from '@pachiplac/shared'

import { PrismaService } from '../prisma/prisma.service'
import type { ActualizarIngresoExtraInput, ListarIngresosExtraQuery } from './dto'

interface IngresoExtraCrudo {
  id: number
  sucursalId: number
  fecha: Date
  material: string
  precioPieza: { toFixed(decimales: number): string }
  precioCinta: { toFixed(decimales: number): string }
  montoTotal: { toFixed(decimales: number): string }
}

@Injectable()
export class IngresosExtraService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    sucursalId: number,
    filtros: ListarIngresosExtraQuery,
  ): Promise<IngresoExtra[]> {
    const rangoFechas = {
      ...(filtros.desde ? { gte: new Date(`${filtros.desde}T00:00:00.000Z`) } : {}),
      ...(filtros.hasta ? { lte: new Date(`${filtros.hasta}T23:59:59.999Z`) } : {}),
    }

    const ingresos = await this.prisma.ingresoExtra.findMany({
      where: {
        sucursalId,
        ...(Object.keys(rangoFechas).length > 0 ? { fecha: rangoFechas } : {}),
        ...(filtros.q ? { material: { contains: filtros.q, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    })

    return ingresos.map((ingreso) => this.aDetalle(ingreso))
  }

  async obtener(sucursalId: number, id: number): Promise<IngresoExtra> {
    const ingreso = await this.prisma.ingresoExtra.findFirst({ where: { id, sucursalId } })
    if (!ingreso) {
      throw new NotFoundException('Ingreso extra no encontrado en la sucursal activa')
    }
    return this.aDetalle(ingreso)
  }

  async crear(sucursalId: number, input: IngresoExtraInput): Promise<IngresoExtra> {
    const ingreso = await this.prisma.ingresoExtra.create({
      data: {
        sucursalId,
        ...(input.fecha ? { fecha: new Date(`${input.fecha}T00:00:00.000Z`) } : {}),
        material: input.material,
        precioPieza: input.precio_pieza,
        precioCinta: input.precio_cinta,
        montoTotal: input.monto_total,
      },
    })
    return this.aDetalle(ingreso)
  }

  async actualizar(
    sucursalId: number,
    id: number,
    input: ActualizarIngresoExtraInput,
  ): Promise<IngresoExtra> {
    await this.verificar(sucursalId, id)

    const ingreso = await this.prisma.ingresoExtra.update({
      where: { id },
      data: {
        ...(input.fecha ? { fecha: new Date(`${input.fecha}T00:00:00.000Z`) } : {}),
        ...(input.material !== undefined ? { material: input.material } : {}),
        ...(input.precio_pieza !== undefined ? { precioPieza: input.precio_pieza } : {}),
        ...(input.precio_cinta !== undefined ? { precioCinta: input.precio_cinta } : {}),
        ...(input.monto_total !== undefined ? { montoTotal: input.monto_total } : {}),
      },
    })
    return this.aDetalle(ingreso)
  }

  async eliminar(sucursalId: number, id: number): Promise<{ ok: true }> {
    await this.verificar(sucursalId, id)
    await this.prisma.ingresoExtra.delete({ where: { id } })
    return { ok: true }
  }

  private async verificar(sucursalId: number, id: number): Promise<void> {
    const existe = await this.prisma.ingresoExtra.findFirst({
      where: { id, sucursalId },
      select: { id: true },
    })
    if (!existe) {
      throw new NotFoundException('Ingreso extra no encontrado en la sucursal activa')
    }
  }

  private aDetalle(ingreso: IngresoExtraCrudo): IngresoExtra {
    return {
      id: ingreso.id,
      sucursal_id: ingreso.sucursalId,
      fecha: ingreso.fecha.toISOString().slice(0, 10),
      material: ingreso.material,
      precio_pieza: ingreso.precioPieza.toFixed(2),
      precio_cinta: ingreso.precioCinta.toFixed(2),
      monto_total: ingreso.montoTotal.toFixed(2),
    }
  }
}

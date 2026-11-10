import { describe, expect, it, vi } from 'vitest'

import type { PrismaService } from '../prisma/prisma.service'
import { IngresosExtraService } from './ingresos-extra.service'

function decimal(valor: string): { toFixed: (decimales: number) => string } {
  return { toFixed: () => valor }
}

const ingreso = {
  id: 1,
  sucursalId: 7,
  fecha: new Date('2026-05-01T00:00:00.000Z'),
  material: 'Retazo roble',
  precioPieza: decimal('20.00'),
  precioCinta: decimal('3.00'),
  montoTotal: decimal('23.00'),
}

describe('IngresosExtraService — CRUD y aislamiento por sucursal', () => {
  it('crea el ingreso con la sucursal de la sesión y la fecha indicada', async () => {
    const crear = vi.fn(
      (_args: {
        data: {
          sucursalId: number
          fecha: Date
          material: string
          precioPieza: string
          precioCinta: string
          montoTotal: string
        }
      }) => Promise.resolve(ingreso),
    )
    const prisma = { ingresoExtra: { create: crear } }
    const service = new IngresosExtraService(prisma as unknown as PrismaService)

    const resultado = await service.crear(7, {
      fecha: '2026-05-01',
      material: 'Retazo roble',
      precio_pieza: '20.00',
      precio_cinta: '3.00',
      monto_total: '23.00',
    })

    const data = crear.mock.calls[0]?.[0]?.data
    expect(data?.sucursalId).toBe(7)
    expect(data?.fecha.toISOString().slice(0, 10)).toBe('2026-05-01')
    expect(resultado).toEqual({
      id: 1,
      sucursal_id: 7,
      fecha: '2026-05-01',
      material: 'Retazo roble',
      precio_pieza: '20.00',
      precio_cinta: '3.00',
      monto_total: '23.00',
    })
  })

  it('lista solo los ingresos de la sucursal activa y aplica el rango de fechas', async () => {
    const findMany = vi.fn(
      (_args: {
        where: {
          sucursalId: number
          fecha?: { gte?: Date; lte?: Date }
          material?: { contains: string; mode: string }
        }
      }) => Promise.resolve([ingreso]),
    )
    const prisma = { ingresoExtra: { findMany } }
    const service = new IngresosExtraService(prisma as unknown as PrismaService)

    const resultado = await service.listar(7, {
      desde: '2026-05-01',
      hasta: '2026-05-31',
      q: 'roble',
    })

    const where = findMany.mock.calls[0]?.[0]?.where
    expect(where?.sucursalId).toBe(7)
    expect(where?.fecha?.gte?.toISOString().slice(0, 10)).toBe('2026-05-01')
    expect(where?.fecha?.lte?.toISOString().slice(0, 10)).toBe('2026-05-31')
    expect(where?.material).toEqual({ contains: 'roble', mode: 'insensitive' })
    expect(resultado).toHaveLength(1)
  })

  it('verifica la sucursal antes de actualizar', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 1 })
    const update = vi.fn().mockResolvedValue(ingreso)
    const prisma = { ingresoExtra: { findFirst, update } }
    const service = new IngresosExtraService(prisma as unknown as PrismaService)

    const resultado = await service.actualizar(7, 1, { material: 'Retazo blanco', monto_total: '30.00' })

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 1, sucursalId: 7 },
      select: { id: true },
    })
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { material: 'Retazo blanco', montoTotal: '30.00' },
    })
    expect(resultado.material).toBe('Retazo roble')
  })

  it('elimina solo si el ingreso pertenece a la sucursal activa', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 1 })
    const borrar = vi.fn().mockResolvedValue(ingreso)
    const prisma = { ingresoExtra: { findFirst, delete: borrar } }
    const service = new IngresosExtraService(prisma as unknown as PrismaService)

    await expect(service.eliminar(7, 1)).resolves.toEqual({ ok: true })
    expect(borrar).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it('rechaza un ingreso de otra sucursal', async () => {
    const prisma = { ingresoExtra: { findFirst: vi.fn().mockResolvedValue(null) } }
    const service = new IngresosExtraService(prisma as unknown as PrismaService)

    await expect(service.eliminar(7, 99)).rejects.toThrow(/no encontrado/)
  })
})

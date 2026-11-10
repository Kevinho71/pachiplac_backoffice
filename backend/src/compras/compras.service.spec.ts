import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../prisma/prisma.service'
import { ComprasService } from './compras.service'

function crearPrismaStub() {
  const compra = {
    id: 1,
    sucursalId: 7,
    productoId: 3,
    fecha: new Date('2026-01-15T00:00:00.000Z'),
    cantidad: 3,
    costoTotal: { toFixed: () => '100.00' },
    producto: {
      id: 3,
      nombre: 'Melamina',
      categoria: 'LAMINA' as const,
      unidadVenta: 'MEDIA' as const,
    },
  }

  const crear = vi.fn(() => compra)
  const findFirst = vi.fn(() => ({ id: 3 }))
  const prisma = {
    producto: { findFirst },
    compra: { create: crear },
  }

  return { prisma: prisma as unknown as PrismaService, crear, compra, findFirst }
}

describe('ComprasService — aislamiento y costo unitario', () => {
  it('verifica el producto contra la sucursal de la sesión', async () => {
    const { prisma, findFirst } = crearPrismaStub()
    const service = new ComprasService(prisma)

    await service.crear(7, { producto_id: 3, cantidad: 3, costo_total: '100.00' })

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 3, sucursalId: 7 },
      select: { id: true },
    })
  })

  it('calcula costo_unitario = costo_total / cantidad', async () => {
    const { prisma } = crearPrismaStub()
    const service = new ComprasService(prisma)

    const resultado = await service.crear(7, {
      producto_id: 3,
      cantidad: 3,
      costo_total: '100.00',
    })

    expect(resultado.costo_unitario).toBe('33.33')
    expect(resultado.costo_total).toBe('100.00')
    expect(resultado.sucursal_id).toBe(7)
  })
})

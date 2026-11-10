import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../prisma/prisma.service'
import { ProductosService } from './productos.service'

function crearPrismaStub() {
  const producto = {
    id: 10,
    sucursalId: 7,
    categoria: 'LAMINA' as const,
    nombre: 'Melamina roble 18 mm',
    unidadVenta: 'MEDIA' as const,
    unidadesPorCompra: 2,
    controlaStock: true,
    activo: true,
    lamina: {
      productoId: 10,
      tipo: 'melamina',
      color: 'Roble',
      espesorMm: 18,
      largoMm: 2750,
      anchoMm: 1830,
      tieneVeta: true,
    },
  }

  const crearProducto = vi.fn(({ data }: { data: Record<string, unknown> }) => ({
    id: 10,
    ...data,
  }))
  const crearLamina = vi.fn(() => ({}))
  const crearPrecio = vi.fn(() => ({}))

  const tx = {
    producto: { create: crearProducto },
    lamina: { create: crearLamina },
    precioHistorial: { create: crearPrecio },
  }

  const transaccion = vi.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx))
  const prisma = {
    $transaction: transaccion,
    producto: {
      findFirst: vi.fn(() => producto),
      update: vi.fn(() => producto),
    },
    $queryRaw: vi.fn(() => []),
  }

  return { prisma: prisma as unknown as PrismaService, crearProducto, crearLamina, crearPrecio }
}

describe('ProductosService — aislamiento por sucursal', () => {
  it('crea el producto con la sucursal de la sesión, no con datos del cuerpo', async () => {
    const { prisma, crearProducto, crearLamina, crearPrecio } = crearPrismaStub()
    const service = new ProductosService(prisma)

    await service.crear(7, {
      categoria: 'LAMINA',
      nombre: 'Melamina roble 18 mm',
      unidad_venta: 'MEDIA',
      lamina: {
        tipo: 'melamina',
        color: 'Roble',
        espesor_mm: 18,
        largo_mm: 2750,
        ancho_mm: 1830,
        tiene_veta: true,
      },
      precio_inicial: '260.00',
    })

    expect(crearProducto).toHaveBeenCalledOnce()
    const llamada = crearProducto.mock.calls[0]?.[0]
    expect(llamada?.data).toMatchObject({ sucursalId: 7, categoria: 'LAMINA' })
    expect(crearLamina).toHaveBeenCalledOnce()
    expect(crearPrecio).toHaveBeenCalledOnce()
  })
})

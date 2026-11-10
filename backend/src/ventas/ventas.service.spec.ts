import { describe, expect, it, vi } from 'vitest'

import type { EsquemaCorte } from '@pachiplac/shared'

import type { PrismaService } from '../prisma/prisma.service'
import { VentasService } from './ventas.service'
import type { VentaDetalle } from './ventas.types'

const LAMINA = {
  id: 10,
  nombre: 'Melamina blanca 18 mm',
  categoria: 'LAMINA' as const,
  unidadVenta: 'MEDIA' as const,
}

const CINTA_COLOCADA = {
  id: 20,
  nombre: 'Cinta de canto colocada',
  categoria: 'CINTA' as const,
  unidadVenta: 'METRO' as const,
}

function esquema(): EsquemaCorte {
  return {
    version: 1,
    kerf_mm: 4,
    refilado_mm: 5,
    modo: 'GUILLOTINA_LIBRE',
    secciones: [
      {
        producto_id: 10,
        hojas: [
          {
            tipo: 'ENTERA',
            largo_mm: 2750,
            ancho_mm: 1830,
            piezas: [
              {
                id: 'p1',
                x: 0,
                y: 0,
                w: 800,
                h: 400,
                rotada: false,
                bordes: { sup: 'Blanco', inf: null, izq: null, der: 'Blanco' },
              },
            ],
            cortes: [],
          },
        ],
      },
    ],
    cinta: { total_m: 0, por_color: {} },
  }
}

function decimal(valor: string): { toFixed: (decimales: number) => string } {
  return { toFixed: () => valor }
}

function ventaDetalleFixture(overrides: Partial<VentaDetalle> = {}): VentaDetalle {
  return {
    orden_venta: 42,
    sucursal_id: 1,
    numero: 4,
    cliente_id: null,
    cliente: null,
    fecha: '2026-04-10T12:00:00.000Z',
    monto_total: '1003.60',
    saldo: '500.00',
    pagado: '503.60',
    cancelada: false,
    metodo_pago: 'Efectivo',
    es_factura: false,
    nro_factura: null,
    entregado: false,
    cantidad_items: 2,
    cinta_colocada_m: 1.2,
    tiene_esquema: false,
    hojas_corte: 0,
    corte_autorizado: true,
    esquema: null,
    items: [],
    ...overrides,
  }
}

/** Fila cruda de Prisma (nombres camelCase y Decimal), tal como la lee el servicio. */
function ventaCrudaFixture(overrides: Record<string, unknown> = {}) {
  return {
    ordenVenta: 42,
    sucursalId: 1,
    numero: 4,
    clienteId: null,
    fecha: new Date('2026-04-10T12:00:00.000Z'),
    montoTotal: decimal('1003.60'),
    saldo: decimal('500.00'),
    metodoPago: 'Efectivo',
    esFactura: false,
    nroFactura: null,
    entregado: false,
    esquema: null,
    cliente: null,
    items: [
      {
        id: 1,
        productoId: 10,
        cantidad: decimal('4.00'),
        precioUnitario: decimal('250.00'),
        producto: LAMINA,
      },
      {
        id: 2,
        productoId: 20,
        cantidad: decimal('1.20'),
        precioUnitario: decimal('3.00'),
        producto: CINTA_COLOCADA,
      },
    ],
    ...overrides,
  }
}

interface VentaCreateArgs {
  data: {
    numero: number
    montoTotal: string
    saldo: string
    items: { create: Array<{ productoId: number; cantidad: string; precioUnitario: string }> }
    esquema: EsquemaCorte
  }
}

describe('VentasService.crear — total, numeración y cinta recalculada', () => {
  it('copia el precio vigente, recalcula la cinta del esquema y numera por sucursal', async () => {
    const crearVenta = vi.fn((_args: VentaCreateArgs) =>
      Promise.resolve({ ordenVenta: 42 }),
    )
    const tx = {
      precioHistorial: {
        findMany: vi.fn().mockResolvedValue([
          { productoId: 10, precio: decimal('250.00') },
          { productoId: 20, precio: decimal('3.00') },
        ]),
      },
      venta: {
        aggregate: vi.fn().mockResolvedValue({ _max: { numero: 3 } }),
        create: crearVenta,
      },
    }

    const productoFindMany = vi.fn((args: { where: { categoria?: string } }) => {
      if (args.where.categoria === 'CINTA') return [CINTA_COLOCADA]
      return [LAMINA, CINTA_COLOCADA]
    })

    const prisma = {
      cliente: { findFirst: vi.fn() },
      producto: { findMany: productoFindMany },
      venta: { findFirst: vi.fn().mockResolvedValue(ventaCrudaFixture()) },
      $transaction: vi.fn((callback: (cliente: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
    }

    const service = new VentasService(prisma as unknown as PrismaService)

    const resultado = await service.crear(1, {
      metodo_pago: 'Efectivo',
      es_factura: false,
      entregado: false,
      saldo: '0.00',
      esquema: esquema(),
      items: [
        { producto_id: 10, cantidad: '4.00', precio_unitario: '999.00' },
        { producto_id: 20, cantidad: '50.00', precio_unitario: '99.00' },
      ],
    })

    expect(resultado.orden_venta).toBe(42)
    expect(productoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [10, 20] }, sucursalId: 1 } }),
    )

    const data = crearVenta.mock.calls[0]?.[0]?.data
    if (!data) throw new Error('No se registró la venta')

    expect(data.numero).toBe(4)
    expect(data.montoTotal).toBe('503.60')
    expect(data.saldo).toBe('0.00')
    // La cinta enviada por el front (50 m) se descarta y se recalcula desde el
    // esquema; la lámina también se ajusta a las 2 medias de la hoja entera.
    expect(data.items.create).toEqual([
      { productoId: 10, cantidad: '2.00', precioUnitario: '250.00' },
      { productoId: 20, cantidad: '1.20', precioUnitario: '3.00' },
    ])
    expect(data.esquema.cinta.total_m).toBe(1.2)
  })
})

describe('VentasService.actualizarSaldo — abono', () => {
  it('resta el abono y devuelve el detalle actualizado', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce({ montoTotal: decimal('100.00'), saldo: decimal('80.00') })
      .mockResolvedValueOnce(
        ventaCrudaFixture({ montoTotal: decimal('100.00'), saldo: decimal('70.00') }),
      )
    const update = vi.fn().mockResolvedValue({})

    const prisma = { venta: { findFirst, update } }
    const service = new VentasService(prisma as unknown as PrismaService)

    const resultado = await service.actualizarSaldo(1, 42, { abono: '10.00' })

    expect(update).toHaveBeenCalledWith({ where: { ordenVenta: 42 }, data: { saldo: '70.00' } })
    expect(resultado.saldo).toBe('70.00')
  })

  it('rechaza un abono mayor al saldo pendiente', async () => {
    const prisma = {
      venta: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ montoTotal: decimal('100.00'), saldo: decimal('20.00') }),
      },
    }
    const service = new VentasService(prisma as unknown as PrismaService)

    await expect(service.actualizarSaldo(1, 42, { abono: '30.00' })).rejects.toThrow(
      /no puede superar el saldo/,
    )
  })
})

describe('VentasService.actualizarEsquema — recálculo transaccional', () => {
  it('ajusta lámina, cinta, total y saldo en la misma transacción', async () => {
    const ventaActual = ventaCrudaFixture({
      montoTotal: decimal('283.60'),
      saldo: decimal('100.00'),
      items: [
        {
          id: 1,
          productoId: 10,
          cantidad: decimal('2.00'),
          precioUnitario: decimal('140.00'),
          producto: LAMINA,
        },
        {
          id: 2,
          productoId: 20,
          cantidad: decimal('1.20'),
          precioUnitario: decimal('3.00'),
          producto: CINTA_COLOCADA,
        },
      ],
    })
    const ventaFinal = ventaCrudaFixture({
      montoTotal: decimal('560.00'),
      saldo: decimal('376.40'),
      esquema: esquema(),
      items: [
        {
          id: 1,
          productoId: 10,
          cantidad: decimal('4.00'),
          precioUnitario: decimal('140.00'),
          producto: LAMINA,
        },
      ],
    })

    const actualizarItem = vi.fn().mockResolvedValue({})
    const borrarItem = vi.fn().mockResolvedValue({})
    const actualizarVenta = vi.fn(
      (_args: { data: { montoTotal: string; saldo: string; esquema: unknown } }) =>
        Promise.resolve({}),
    )
    const tx = {
      ventaItem: {
        update: actualizarItem,
        delete: borrarItem,
        findMany: vi
          .fn()
          .mockResolvedValue([{ cantidad: decimal('4.00'), precioUnitario: decimal('140.00') }]),
      },
      producto: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 10, nombre: LAMINA.nombre, categoria: 'LAMINA', unidadVenta: 'MEDIA' }]),
      },
      precioHistorial: { findFirst: vi.fn() },
      venta: { update: actualizarVenta },
    }

    const prisma = {
      venta: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(ventaActual)
          .mockResolvedValueOnce(ventaFinal),
      },
      producto: { findMany: vi.fn().mockResolvedValue([LAMINA, CINTA_COLOCADA]) },
      $transaction: vi.fn((callback: (cliente: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
    }

    const service = new VentasService(prisma as unknown as PrismaService)
    const esquemaNuevo = esquema()
    esquemaNuevo.secciones[0].hojas = [
      {
        tipo: 'ENTERA',
        largo_mm: 2750,
        ancho_mm: 1830,
        piezas: [
          {
            id: 'p1',
            x: 0,
            y: 0,
            w: 800,
            h: 400,
            rotada: false,
            bordes: { sup: null, inf: null, izq: null, der: null },
          },
        ],
        cortes: [],
      },
      {
        tipo: 'ENTERA',
        largo_mm: 2750,
        ancho_mm: 1830,
        piezas: [],
        cortes: [],
      },
    ]

    const resultado = await service.actualizarEsquema(1, 42, { esquema: esquemaNuevo })

    expect(actualizarItem).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { cantidad: '4.00' },
    })
    expect(borrarItem).toHaveBeenCalledWith({ where: { id: 2 } })
    const llamada = actualizarVenta.mock.calls[0]?.[0]
    expect(llamada?.data.montoTotal).toBe('560.00')
    expect(llamada?.data.saldo).toBe('376.40')
    expect(resultado.monto_total).toBe('560.00')
    expect(resultado.saldo).toBe('376.40')
  })
})

describe('VentasService.documentoImpresion — regla del 50%', () => {
  it('avisa pero no bloquea cuando el saldo supera la mitad', async () => {
    const prisma = {
      sucursal: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          nombre: 'Sucursal Centro',
          ciudad: 'Tarija',
          direccion: null,
          telefono: null,
        }),
      },
    }
    const service = new VentasService(prisma as unknown as PrismaService)
    vi.spyOn(service, 'obtener').mockResolvedValue(
      ventaDetalleFixture({ monto_total: '100.00', saldo: '60.00', corte_autorizado: false }),
    )

    const documento = await service.documentoImpresion(1, 42, 'NOTA')

    expect(documento.autorizado).toBe(false)
    expect(documento.aviso).toMatch(/supera la mitad/)
    expect(documento.venta.orden_venta).toBe(42)
  })
})

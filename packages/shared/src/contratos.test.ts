import { describe, expect, it } from 'vitest'

import {
  cantidadSchema,
  dineroSchema,
  productoInputSchema,
  ventaInputSchema,
} from './index'

describe('dineroSchema', () => {
  it('acepta montos con hasta 2 decimales y rechaza negativos o con más decimales', () => {
    expect(dineroSchema.parse('14.60')).toBe('14.60')
    expect(dineroSchema.parse('0')).toBe('0')
    expect(() => dineroSchema.parse('-1.00')).toThrow()
    expect(() => dineroSchema.parse('1.005')).toThrow()
    expect(() => dineroSchema.parse('1,50')).toThrow()
  })

  it('cantidadSchema exige que sea mayor que 0', () => {
    expect(cantidadSchema.parse('0.01')).toBe('0.01')
    expect(() => cantidadSchema.parse('0.00')).toThrow()
  })
})

describe('productoInputSchema', () => {
  it('acepta una lámina válida y aplica los valores por defecto', () => {
    const producto = productoInputSchema.parse({
      categoria: 'LAMINA',
      nombre: 'Melamina Roble 18 mm',
      unidad_venta: 'MEDIA',
    })
    expect(producto.unidades_por_compra).toBe(1)
    expect(producto.controla_stock).toBe(true)
    expect(producto.activo).toBe(true)
  })

  it('rechaza una categoría inválida', () => {
    expect(() =>
      productoInputSchema.parse({
        categoria: 'MADERA',
        nombre: 'Roble',
        unidad_venta: 'MEDIA',
      }),
    ).toThrow()
  })

  it('rechaza la incoherencia entre categoría y unidad de venta', () => {
    expect(() =>
      productoInputSchema.parse({
        categoria: 'LAMINA',
        nombre: 'Roble',
        unidad_venta: 'METRO',
      }),
    ).toThrow()
  })
})

describe('ventaInputSchema', () => {
  const base = {
    numero: 1,
    monto_total: '100.00',
    saldo: '50.00',
    metodo_pago: 'Efectivo',
  }

  it('acepta una venta válida y aplica los valores por defecto', () => {
    const venta = ventaInputSchema.parse(base)
    expect(venta.es_factura).toBe(false)
    expect(venta.entregado).toBe(false)
    expect(venta.saldo).toBe('50.00')
  })

  it('rechaza un saldo mayor que el monto total', () => {
    expect(() => ventaInputSchema.parse({ ...base, saldo: '150.00' })).toThrow()
  })

  it('rechaza un número de factura en una venta sin factura', () => {
    expect(() => ventaInputSchema.parse({ ...base, nro_factura: 'A-1' })).toThrow()
  })
})

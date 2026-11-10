import { describe, expect, it } from 'vitest'

import type { EsquemaCorte } from '@pachiplac/shared'

import {
  ajusteDeVenta,
  autorizaCorte,
  calcularCintaDeEsquema,
  esCintaColocada,
  esquemaCanonico,
  montoConAjuste,
  saldoTrasAbono,
  subtotalItem,
  totalDeItems,
} from './ventas.helpers'

function esquemaBase(): EsquemaCorte {
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
              {
                id: 'p2',
                x: 0,
                y: 404,
                w: 500,
                h: 300,
                rotada: true,
                bordes: { sup: null, inf: null, izq: 'Roble', der: null },
              },
            ],
            cortes: [{ n: 1, orientacion: 'V', posicion: 804, desde: 0, hasta: 1830 }],
          },
        ],
      },
    ],
    cinta: { total_m: 0, por_color: {} },
  }
}

describe('ventas.helpers — cinta y esquema', () => {
  it('detecta el producto de cinta colocada por nombre, sin acentos', () => {
    expect(esCintaColocada('Cinta de canto colocada')).toBe(true)
    expect(esCintaColocada('CINTA COLOCADA')).toBe(true)
    expect(esCintaColocada('Cinta de canto suelta')).toBe(false)
  })

  it('recalcula los metros de cinta desde las piezas, no desde el JSON', () => {
    const metros = calcularCintaDeEsquema(esquemaBase())
    // p1: sup (largo 800) + der (ancho 400) = 1200 mm
    // p2: izq (ancho 300) = 300 mm  -> total 1500 mm = 1,5 m
    expect(metros.total).toBe(1.5)
    expect(metros.porColor).toEqual({ Blanco: 1.2, Roble: 0.3 })
  })

  it('devuelve un esquema canónico con la cinta recalculada', () => {
    const canonico = esquemaCanonico(esquemaBase())
    expect(canonico.cinta.total_m).toBe(1.5)
    expect(canonico.cinta.por_color).toEqual({ Blanco: 1.2, Roble: 0.3 })
  })

  it('sin esquema no hay cinta', () => {
    expect(calcularCintaDeEsquema(null)).toEqual({ total: 0, porColor: {} })
  })
})

describe('ventas.helpers — dinero y reglas', () => {
  it('calcula subtotales y totales con exactitud decimal', () => {
    expect(subtotalItem('3.00', '3.00')).toBe('9.00')
    expect(
      totalDeItems([
        { cantidad: '4.00', precio_unitario: '250.00' },
        { cantidad: '1.50', precio_unitario: '3.00' },
      ]),
    ).toBe('1004.50')
  })

  it('autoriza el corte con saldo <= 50% del total', () => {
    expect(autorizaCorte('100.00', '50.00')).toBe(true)
    expect(autorizaCorte('100.00', '50.01')).toBe(false)
    expect(autorizaCorte('0.00', '0.00')).toBe(true)
  })

  it('calcula el saldo tras un abono sin Permitir sobregiros', () => {
    expect(saldoTrasAbono('30.00', '10.00')).toBe('20.00')
    expect(saldoTrasAbono('10.00', '20.00')).toBeNull()
    expect(saldoTrasAbono('0.01', '0.01')).toBe('0.00')
  })

  it('conserva el ajuste manual al recalcular el esquema', () => {
    const ajuste = ajusteDeVenta('90.00', [
      { cantidad: '1.00', precio_unitario: '100.00' },
    ])
    expect(ajuste).toBe('-10.00')
    expect(montoConAjuste('120.00', ajuste)).toBe('110.00')
    expect(montoConAjuste('5.00', '-10.00')).toBe('0.00')
  })
})

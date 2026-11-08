import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { calcularMetrosCinta } from '@pachiplac/shared'
import { optimizar, validarHoja, type HojaDisponible, type PiezaEntrada } from './index'

const MELAMINA: HojaDisponible[] = [{ tipo: 'ENTERA', largo: 2750, ancho: 1830, costoMedias: 2 }]

const OPCIONES_BASE = {
  kerf: 4,
  refilado_mm: 5,
  tiempoMaxMs: 250,
  semilla: 42,
} as const

function pieza(
  id: string,
  largo: number,
  ancho: number,
  cantidad = 1,
  puedeRotar = true,
): PiezaEntrada {
  return { id, etiqueta: id, largo, ancho, cantidad, puedeRotar, bordes: {} }
}

const piezasArbitrarias = fc
  .array(
    fc.record({
      largo: fc.integer({ min: 100, max: 2000 }),
      ancho: fc.integer({ min: 100, max: 1750 }),
      cantidad: fc.integer({ min: 1, max: 3 }),
      puedeRotar: fc.boolean(),
      color: fc.constantFrom('Blanco', 'Roble', 'Wengué'),
      lados: fc.array(fc.constantFrom('sup', 'inf', 'izq', 'der'), { maxLength: 4 }),
    }),
    { minLength: 1, maxLength: 10 },
  )
  .map((filas): PiezaEntrada[] =>
    filas.map((fila, indice) => {
      const bordes: PiezaEntrada['bordes'] = {}
      for (const lado of fila.lados) bordes[lado] = fila.color
      return {
        id: `p${indice}`,
        etiqueta: `Pieza ${indice + 1}`,
        largo: fila.largo,
        ancho: fila.ancho,
        cantidad: fila.cantidad,
        puedeRotar: fila.puedeRotar,
        bordes,
      }
    }),
  )

describe('optimizar: propiedades', () => {
  it('coloca todas las piezas sin solapes y con cortes válidos (guillotina libre)', () => {
    fc.assert(
      fc.property(piezasArbitrarias, (piezas) => {
        const resultado = optimizar(piezas, MELAMINA, OPCIONES_BASE)

        const esperadas = piezas.reduce((total, p) => total + p.cantidad, 0)
        const colocadas = resultado.hojas.flatMap((hoja) => hoja.piezas)
        expect(colocadas).toHaveLength(esperadas)
        expect(resultado.noCaben).toEqual([])

        const areaUtil = (2750 - 2 * 5) * (1830 - 2 * 5)
        for (const hoja of resultado.hojas) {
          const validacion = validarHoja(hoja, { kerf: 4, refilado_mm: 5 })
          expect(validacion.errores).toEqual([])
          expect(validacion.valido).toBe(true)

          const areaPiezas = hoja.piezas.reduce((total, p) => total + p.w * p.h, 0)
          expect(areaPiezas).toBeLessThanOrEqual(areaUtil + 1e-6)
          expect(hoja.aprovechamiento).toBeGreaterThan(0)
          expect(hoja.aprovechamiento).toBeLessThanOrEqual(1)
        }

        expect(resultado.metrosCinta).toEqual(calcularMetrosCinta(piezas))
        expect(resultado.totalMedias).toBe(
          resultado.hojas.reduce((total, hoja) => total + (hoja.tipo === 'ENTERA' ? 2 : 1), 0),
        )
      }),
      { numRuns: 25 },
    )
  })

  it('el modo DOS_ETAPAS también produce esquemas cortables', () => {
    fc.assert(
      fc.property(piezasArbitrarias, (piezas) => {
        const resultado = optimizar(piezas, MELAMINA, {
          ...OPCIONES_BASE,
          modoCorte: 'DOS_ETAPAS',
          primerCorte: 'AUTO',
        })

        const esperadas = piezas.reduce((total, p) => total + p.cantidad, 0)
        expect(resultado.hojas.flatMap((hoja) => hoja.piezas)).toHaveLength(esperadas)
        for (const hoja of resultado.hojas) {
          expect(validarHoja(hoja, { kerf: 4, refilado_mm: 5 }).valido).toBe(true)
        }
      }),
      { numRuns: 20 },
    )
  })
})

describe('optimizar: reglas puntuales', () => {
  it('respeta el kerf: dos piezas de 500 mm no entran en una hoja de 1000 mm', () => {
    const resultado = optimizar(
      [pieza('p', 500, 500, 2, false)],
      [{ tipo: 'ENTERA', largo: 1000, ancho: 1000, costoMedias: 2 }],
      {
        kerf: 4,
        refilado_mm: 0,
        tiempoMaxMs: 100,
      },
    )

    // 500 + 4 + 500 = 1004 > 1000: la segunda pieza necesita otra hoja.
    const colocadas = resultado.hojas.flatMap((hoja) => hoja.piezas)
    expect(colocadas).toHaveLength(2)
    expect(resultado.hojas.length).toBeGreaterThanOrEqual(2)
  })

  it('descuenta el refilado de los bordes de la hoja', () => {
    const medida = 990
    const hoja: HojaDisponible[] = [{ tipo: 'ENTERA', largo: 1000, ancho: 1000, costoMedias: 2 }]

    expect(
      optimizar([pieza('p', medida, medida, 1, false)], hoja, { kerf: 4, refilado_mm: 10 }).noCaben,
    ).toEqual(['p'])

    expect(
      optimizar([pieza('p', medida, medida, 1, false)], hoja, { kerf: 4, refilado_mm: 0 }).noCaben,
    ).toEqual([])
  })

  it('rota la pieza cuando así entra en la hoja', () => {
    const resultado = optimizar([pieza('alta', 1000, 1900, 1, true)], MELAMINA, OPCIONES_BASE)
    const colocada = resultado.hojas[0]?.piezas[0]
    expect(colocada?.rotada).toBe(true)
    expect(colocada?.w).toBe(1900)
    expect(colocada?.h).toBe(1000)
  })

  it('marca como noCaben las piezas más grandes que cualquier hoja', () => {
    const resultado = optimizar(
      [pieza('chica', 500, 300), pieza('gigante', 3000, 400, 1, false)],
      MELAMINA,
      OPCIONES_BASE,
    )
    expect(resultado.noCaben).toEqual(['gigante'])
    expect(resultado.hojas.flatMap((hoja) => hoja.piezas).map((p) => p.idPieza)).toEqual(['chica'])
  })

  it('baja a media hoja cuando todas las piezas caben en una mitad', () => {
    const resultado = optimizar([pieza('p', 600, 800, 4)], MELAMINA, {
      ...OPCIONES_BASE,
      kerf: 0,
      refilado_mm: 0,
    })
    expect(resultado.totalMedias).toBe(1)
    expect(resultado.hojas).toHaveLength(1)
    expect(resultado.hojas[0]?.tipo).not.toBe('ENTERA')
  })

  it('es reproducible con la misma semilla', () => {
    const piezas = [
      pieza('a', 900, 400, 2),
      pieza('b', 1200, 300, 3),
      pieza('c', 700, 500, 2),
      pieza('d', 1800, 400, 1),
    ]
    const uno = optimizar(piezas, MELAMINA, { ...OPCIONES_BASE, semilla: 7 })
    const otro = optimizar(piezas, MELAMINA, { ...OPCIONES_BASE, semilla: 7 })
    expect(otro).toEqual(uno)
  })

  it('calcula los metros de cinta desde las piezas de entrada', () => {
    const piezas: PiezaEntrada[] = [
      {
        ...pieza('p', 800, 400),
        bordes: { sup: 'Blanco', inf: 'Blanco', izq: 'Roble', der: 'Roble' },
      },
    ]
    const resultado = optimizar(piezas, MELAMINA, OPCIONES_BASE)
    expect(resultado.metrosCinta.porColor).toEqual({ Blanco: 1.6, Roble: 0.8 })
    expect(resultado.metrosCinta.total).toBe(2.4)
  })

  it('valida los índices y dimensiones de entrada', () => {
    expect(() => optimizar([pieza('p', 0, 100)], MELAMINA)).toThrow(/largo inválido/)
    expect(() => optimizar([pieza('p', 100, 100, 0)], MELAMINA)).toThrow(/cantidad inválida/)
    expect(() => optimizar([pieza('p', 100, 100), pieza('p', 200, 200)], MELAMINA)).toThrow(
      /duplicado/,
    )
    expect(() => optimizar([pieza('p', 100, 100)], [])).toThrow(/al menos un tipo de hoja/)
  })
})

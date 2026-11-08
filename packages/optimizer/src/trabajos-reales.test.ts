import { describe, expect, it } from 'vitest'
import { calcularMetrosCinta } from '@pachiplac/shared'
import { optimizar, validarHoja } from './index'
import { TRABAJOS } from './__fixtures__/trabajos-reales'

describe.each(TRABAJOS.map((trabajo) => [trabajo.nombre, trabajo] as const))(
  'trabajo real: %s',
  (_nombre, trabajo) => {
    const resultado = optimizar(trabajo.piezas, trabajo.hojas, {
      kerf: 4,
      refilado_mm: 5,
      modoCorte: 'GUILLOTINA_LIBRE',
      primerCorte: 'AUTO',
      tiempoMaxMs: 1500,
      semilla: 20260101,
    })

    it('coloca todas las piezas', () => {
      const esperadas = trabajo.piezas.reduce((total, p) => total + p.cantidad, 0)
      expect(resultado.noCaben).toEqual([])
      expect(resultado.hojas.flatMap((hoja) => hoja.piezas)).toHaveLength(esperadas)
    })

    it('genera esquemas cortables por guillotina', () => {
      for (const hoja of resultado.hojas) {
        expect(validarHoja(hoja, { kerf: 4, refilado_mm: 5 }).errores).toEqual([])
      }
    })

    it('no gasta más medias hojas que el trabajo real', () => {
      expect(resultado.totalMedias).toBeLessThanOrEqual(trabajo.mediasReales)
    })

    it('calcula la cinta igual que la función compartida', () => {
      expect(resultado.metrosCinta).toEqual(calcularMetrosCinta(trabajo.piezas))
    })

    it('numera los cortes de forma consecutiva en cada hoja', () => {
      for (const hoja of resultado.hojas) {
        expect(hoja.cortes.map((corte) => corte.n)).toEqual(
          hoja.cortes.map((_, indice) => indice + 1),
        )
      }
    })
  },
)

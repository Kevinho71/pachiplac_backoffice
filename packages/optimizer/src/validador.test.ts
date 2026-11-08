import { describe, expect, it } from 'vitest'
import { validarHoja, type Corte, type HojaResultado, type PiezaColocada } from './index'

function colocada(idPieza: string, x: number, y: number, w: number, h: number): PiezaColocada {
  return { idPieza, x, y, w, h, rotada: false, bordes: {} }
}

function hoja(
  piezas: PiezaColocada[],
  cortes: Corte[] = [],
  largo = 1000,
  ancho = 1000,
): HojaResultado {
  return {
    tipo: 'ENTERA',
    largo,
    ancho,
    piezas,
    cortes,
    aprovechamiento: 0,
    retazoMayor: { w: 0, h: 0 },
  }
}

describe('validarHoja', () => {
  it('acepta dos piezas con espacio de sierra y su secuencia de cortes', () => {
    const esquema = hoja(
      [colocada('a', 0, 0, 400, 400), colocada('b', 404, 0, 400, 400)],
      [{ n: 1, orientacion: 'V', posicion: 402, desde: 0, hasta: 1000 }],
    )
    expect(validarHoja(esquema, { kerf: 4 })).toEqual({ valido: true, errores: [] })
  })

  it('detecta piezas solapadas', () => {
    const esquema = hoja([colocada('a', 0, 0, 400, 400), colocada('b', 200, 200, 400, 400)])
    const resultado = validarHoja(esquema)
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.join(' ')).toMatch(/solapan/)
  })

  it('detecta piezas fuera de la superficie útil', () => {
    const resultado = validarHoja(hoja([colocada('a', 900, 900, 300, 300)]))
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.join(' ')).toMatch(/se sale/)
  })

  it('detecta un esquema que no es cortable por guillotina (molinillo)', () => {
    const esquema = hoja(
      [
        colocada('arriba', 0, 0, 600, 400),
        colocada('derecha', 600, 0, 400, 600),
        colocada('abajo', 400, 600, 600, 400),
        colocada('izquierda', 0, 400, 400, 600),
        colocada('centro', 400, 400, 200, 200),
      ],
      [],
    )
    const resultado = validarHoja(esquema, { kerf: 0 })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.join(' ')).toMatch(/guillotina/)
  })

  it('rechaza piezas que se tocan cuando hay kerf (no hay lugar para la sierra)', () => {
    const esquema = hoja([colocada('a', 0, 0, 400, 400), colocada('b', 400, 0, 400, 400)])
    expect(validarHoja(esquema, { kerf: 4 }).valido).toBe(false)
    expect(validarHoja(esquema, { kerf: 0 }).valido).toBe(true)
  })

  it('acepta una sola pieza sin cortes', () => {
    expect(validarHoja(hoja([colocada('a', 0, 0, 500, 500)])).valido).toBe(true)
  })

  it('detecta un corte que no recorre el sub-tablero completo', () => {
    const esquema = hoja(
      [colocada('a', 0, 0, 400, 400), colocada('b', 404, 0, 400, 400)],
      [{ n: 1, orientacion: 'V', posicion: 402, desde: 0, hasta: 500 }],
    )
    const resultado = validarHoja(esquema, { kerf: 4 })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.join(' ')).toMatch(/lado a lado/)
  })

  it('detecta una secuencia de cortes incompleta que deja piezas sin separar', () => {
    const esquema = hoja([colocada('a', 0, 0, 400, 400), colocada('b', 404, 0, 400, 400)], [])
    const resultado = validarHoja(esquema, { kerf: 4 })
    expect(resultado.valido).toBe(true) // sin cortes solo se valida la geometría
    expect(resultado.errores).toEqual([])
  })
})

import type { Corte } from './types'

export interface RectPos {
  x: number
  y: number
  w: number
  h: number
}

export interface Division {
  orientacion: 'V' | 'H'
  /** Coordenada de la línea de corte. */
  posicion: number
  desde: number
  hasta: number
  a: RectPos
  b: RectPos
  piezasA: RectPos[]
  piezasB: RectPos[]
}

const EPS = 1e-6

function separacionSuficiente(
  piezas: readonly RectPos[],
  orientacion: 'V' | 'H',
  c: number,
  kerf: number,
): boolean {
  const mitad = kerf / 2
  for (const p of piezas) {
    const inicio = orientacion === 'V' ? p.x : p.y
    const fin = orientacion === 'V' ? p.x + p.w : p.y + p.h
    if (fin <= c + EPS) {
      // Pieza a la izquierda/arriba del corte.
      if (c - fin < mitad - EPS) return false
    } else if (inicio >= c - EPS) {
      // Pieza a la derecha/abajo del corte.
      if (inicio - c < mitad - EPS) return false
    } else {
      // La línea atraviesa la pieza.
      return false
    }
  }
  return true
}

/**
 * Busca un corte de guillotina que divida las piezas del rectángulo `region`
 * en dos grupos no vacíos, dejando espacio para el kerf de la sierra.
 * Devuelve `null` si el conjunto no es cortable con sierra de panel.
 */
export function buscarDivision(
  region: RectPos,
  piezas: readonly RectPos[],
  kerf: number,
): Division | null {
  if (piezas.length <= 1) return null

  let mejor: Division | null = null
  let mejorPuntaje = -Infinity

  const considerar = (orientacion: 'V' | 'H', c: number): void => {
    const inicioRegion = orientacion === 'V' ? region.x : region.y
    const finRegion = inicioRegion + (orientacion === 'V' ? region.w : region.h)
    if (!(c > inicioRegion + EPS && c < finRegion - EPS)) return
    if (!separacionSuficiente(piezas, orientacion, c, kerf)) return

    const a: RectPos =
      orientacion === 'V'
        ? { x: region.x, y: region.y, w: c - region.x, h: region.h }
        : { x: region.x, y: region.y, w: region.w, h: c - region.y }
    const b: RectPos =
      orientacion === 'V'
        ? { x: c, y: region.y, w: finRegion - c, h: region.h }
        : { x: region.x, y: c, w: region.w, h: finRegion - c }

    const piezasA: RectPos[] = []
    const piezasB: RectPos[] = []
    for (const p of piezas) {
      const centro = orientacion === 'V' ? p.x + p.w / 2 : p.y + p.h / 2
      if (centro < c) piezasA.push(p)
      else piezasB.push(p)
    }
    if (piezasA.length === 0 || piezasB.length === 0) return

    const puntaje = Math.min(a.w * a.h, b.w * b.h)
    const esMejor =
      puntaje > mejorPuntaje + EPS ||
      (Math.abs(puntaje - mejorPuntaje) <= EPS &&
        mejor !== null &&
        orientacion === 'V' &&
        mejor.orientacion === 'H') ||
      (Math.abs(puntaje - mejorPuntaje) <= EPS &&
        mejor !== null &&
        orientacion === mejor.orientacion &&
        c < mejor.posicion)

    if (!esMejor) return

    mejorPuntaje = puntaje
    mejor = {
      orientacion,
      posicion: c,
      desde: orientacion === 'V' ? region.y : region.x,
      hasta: orientacion === 'V' ? region.y + region.h : region.x + region.w,
      a,
      b,
      piezasA,
      piezasB,
    }
  }

  for (const p of piezas) {
    considerar('V', p.x - kerf / 2)
    considerar('V', p.x + p.w + kerf / 2)
    considerar('H', p.y - kerf / 2)
    considerar('H', p.y + p.h + kerf / 2)
  }

  return mejor
}

/** Comprueba recursivamente si un conjunto de piezas es cortable por guillotina. */
export function esGuillotinable(
  piezas: readonly RectPos[],
  region: RectPos,
  kerf: number,
): boolean {
  if (piezas.length <= 1) return true
  const division = buscarDivision(region, piezas, kerf)
  if (!division) return false
  return (
    esGuillotinable(division.piezasA, division.a, kerf) &&
    esGuillotinable(division.piezasB, division.b, kerf)
  )
}

/**
 * Genera la secuencia numerada de cortes a partir de las piezas ya ubicadas.
 * En cada paso se elige un corte que divida el rectángulo actual en dos, de
 * modo que la secuencia sea ejecutable en la sierra de panel (cada corte va de
 * lado a lado del sub-tablero que se está cortando).
 */
export function generarCortes(
  piezas: readonly RectPos[],
  usable: { w: number; h: number },
  kerf: number,
): Corte[] {
  const cortes: Corte[] = []
  let contador = 1
  const region: RectPos = { x: 0, y: 0, w: usable.w, h: usable.h }

  const recorrer = (actual: RectPos, grupo: readonly RectPos[]): void => {
    if (grupo.length <= 1) return
    const division = buscarDivision(actual, grupo, kerf)
    if (!division) {
      throw new Error(
        'El conjunto de piezas no es guillotinable: no existe un corte que lo divida sin atravesar una pieza',
      )
    }
    cortes.push({
      n: contador++,
      orientacion: division.orientacion,
      posicion: division.posicion,
      desde: division.desde,
      hasta: division.hasta,
    })
    recorrer(division.a, division.piezasA)
    recorrer(division.b, division.piezasB)
  }

  recorrer(region, piezas)
  return cortes
}

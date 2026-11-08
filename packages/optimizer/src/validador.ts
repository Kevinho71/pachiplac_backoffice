import { contiene, seSolapan } from './geometria'
import { esGuillotinable, type RectPos } from './cortes'
import type { Corte, HojaResultado } from './types'

export interface OpcionesValidacion {
  /** Grosor de sierra con el que se comprueba que haya lugar para cortar. Por defecto 4 mm. */
  kerf?: number
  /** Refilado con el que se generó el esquema (0 si no se aplicó). Por defecto 0. */
  refilado_mm?: number
}

export interface ResultadoValidacion {
  valido: boolean
  errores: string[]
}

const EPS = 1e-6
const TOL = 0.01

function cerca(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOL
}

function validarSecuencia(
  cortes: readonly Corte[],
  usable: { w: number; h: number },
  piezas: readonly RectPos[],
): string[] {
  const errores: string[] = []
  const regiones: RectPos[] = [{ x: 0, y: 0, w: usable.w, h: usable.h }]
  const ordenados = [...cortes].sort((a, b) => a.n - b.n)

  for (let i = 0; i < ordenados.length; i++) {
    const corte = ordenados[i]
    if (corte.n !== i + 1) {
      errores.push(
        `La numeración de cortes no es consecutiva: se esperaba ${i + 1} y llegó ${corte.n}`,
      )
      return errores
    }

    let indice: number
    if (corte.orientacion === 'V') {
      if (corte.desde >= corte.hasta || corte.posicion <= 0 || corte.posicion >= usable.w) {
        errores.push(`Corte #${corte.n}: tramo o posición fuera de la hoja`)
        return errores
      }
      indice = regiones.findIndex(
        (r) =>
          cerca(r.y, corte.desde) &&
          cerca(r.y + r.h, corte.hasta) &&
          corte.posicion > r.x + EPS &&
          corte.posicion < r.x + r.w - EPS,
      )
    } else {
      if (corte.desde >= corte.hasta || corte.posicion <= 0 || corte.posicion >= usable.h) {
        errores.push(`Corte #${corte.n}: tramo o posición fuera de la hoja`)
        return errores
      }
      indice = regiones.findIndex(
        (r) =>
          cerca(r.x, corte.desde) &&
          cerca(r.x + r.w, corte.hasta) &&
          corte.posicion > r.y + EPS &&
          corte.posicion < r.y + r.h - EPS,
      )
    }

    if (indice < 0) {
      errores.push(`Corte #${corte.n}: no recorre de lado a lado ningún sub-tablero pendiente`)
      return errores
    }

    const region = regiones[indice]
    regiones.splice(indice, 1)
    if (corte.orientacion === 'V') {
      regiones.push(
        { x: region.x, y: region.y, w: corte.posicion - region.x, h: region.h },
        { x: corte.posicion, y: region.y, w: region.x + region.w - corte.posicion, h: region.h },
      )
    } else {
      regiones.push(
        { x: region.x, y: region.y, w: region.w, h: corte.posicion - region.y },
        { x: region.x, y: corte.posicion, w: region.w, h: region.y + region.h - corte.posicion },
      )
    }
  }

  for (const pieza of piezas) {
    if (!regiones.some((r) => contiene(r, pieza))) {
      errores.push(
        `La pieza en (${pieza.x}, ${pieza.y}) no queda aislada por la secuencia de cortes`,
      )
      return errores
    }
  }

  for (const region of regiones) {
    const dentro = piezas.filter((p) => contiene(region, p))
    if (dentro.length > 1) {
      errores.push(
        `La secuencia de cortes deja ${dentro.length} piezas sin separar en (${region.x}, ${region.y})`,
      )
      return errores
    }
  }

  return errores
}

/**
 * Valida que una hoja de corte sea ejecutable con sierra de panel:
 * piezas dentro de la superficie útil, sin solapes, cortable por guillotina y,
 * si se incluye la secuencia de cortes, que cada corte recorra de lado a lado
 * el sub-tablero donde se ejecuta.
 */
export function validarHoja(
  hoja: HojaResultado,
  opciones: OpcionesValidacion = {},
): ResultadoValidacion {
  const kerf = opciones.kerf ?? 4
  const refilado = opciones.refilado_mm ?? 0
  const errores: string[] = []

  if (!(hoja.largo > 0) || !(hoja.ancho > 0)) {
    return { valido: false, errores: ['La hoja no tiene medidas válidas'] }
  }

  const usable = { w: hoja.largo - 2 * refilado, h: hoja.ancho - 2 * refilado }
  if (usable.w <= 0 || usable.h <= 0) {
    return { valido: false, errores: ['El refilado no deja superficie útil en la hoja'] }
  }

  for (const pieza of hoja.piezas) {
    if (!(pieza.w > 0) || !(pieza.h > 0)) {
      errores.push(`Pieza ${pieza.idPieza}: dimensiones inválidas (${pieza.w} × ${pieza.h})`)
      continue
    }
    if (
      pieza.x < -EPS ||
      pieza.y < -EPS ||
      pieza.x + pieza.w > usable.w + TOL ||
      pieza.y + pieza.h > usable.h + TOL
    ) {
      errores.push(`Pieza ${pieza.idPieza}: se sale de la superficie útil de la hoja`)
    }
  }

  for (let i = 0; i < hoja.piezas.length; i++) {
    for (let j = i + 1; j < hoja.piezas.length; j++) {
      if (seSolapan(hoja.piezas[i], hoja.piezas[j])) {
        errores.push(
          `Las piezas ${hoja.piezas[i]?.idPieza} y ${hoja.piezas[j]?.idPieza} se solapan`,
        )
      }
    }
  }

  if (errores.length > 0) return { valido: false, errores }

  if (!esGuillotinable(hoja.piezas, { x: 0, y: 0, w: usable.w, h: usable.h }, kerf)) {
    errores.push(
      'El esquema no es cortable por guillotina (hay un corte que atravesaría una pieza)',
    )
  }

  if (hoja.cortes.length > 0) {
    errores.push(...validarSecuencia(hoja.cortes, usable, hoja.piezas))
  }

  return { valido: errores.length === 0, errores }
}

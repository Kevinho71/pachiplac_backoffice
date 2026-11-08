import type { PiezaEntrada } from './types'

export interface Instancia {
  /** Clave única de la copia (una pieza con cantidad 3 genera 3 instancias). */
  key: string
  pieza: PiezaEntrada
  copia: number
}

export interface Orientacion {
  w: number
  h: number
  rotada: boolean
}

function validarPieza(pieza: PiezaEntrada): void {
  if (!pieza.id) throw new Error('Toda pieza necesita un id')
  if (!Number.isFinite(pieza.largo) || pieza.largo <= 0) {
    throw new RangeError(`Pieza ${pieza.id}: largo inválido (${pieza.largo})`)
  }
  if (!Number.isFinite(pieza.ancho) || pieza.ancho <= 0) {
    throw new RangeError(`Pieza ${pieza.id}: ancho inválido (${pieza.ancho})`)
  }
  if (!Number.isInteger(pieza.cantidad) || pieza.cantidad <= 0) {
    throw new RangeError(`Pieza ${pieza.id}: cantidad inválida (${pieza.cantidad})`)
  }
}

export function expandirPiezas(piezas: readonly PiezaEntrada[]): Instancia[] {
  const instancias: Instancia[] = []
  const ids = new Set<string>()
  for (const pieza of piezas) {
    validarPieza(pieza)
    if (ids.has(pieza.id)) throw new Error(`Id de pieza duplicado: ${pieza.id}`)
    ids.add(pieza.id)
    for (let copia = 1; copia <= pieza.cantidad; copia++) {
      instancias.push({ key: `${pieza.id}#${copia}`, pieza, copia })
    }
  }
  return instancias
}

/** Orientaciones posibles: la original y, si se permite rotar, largo ↔ ancho. */
export function orientaciones(pieza: PiezaEntrada): Orientacion[] {
  const base: Orientacion = { w: pieza.largo, h: pieza.ancho, rotada: false }
  if (!pieza.puedeRotar || pieza.largo === pieza.ancho) return [base]
  return [base, { w: pieza.ancho, h: pieza.largo, rotada: true }]
}

export function areaPieza(pieza: PiezaEntrada): number {
  return pieza.largo * pieza.ancho
}

export function ladoMayor(pieza: PiezaEntrada): number {
  return Math.max(pieza.largo, pieza.ancho)
}

export function ladoMenor(pieza: PiezaEntrada): number {
  return Math.min(pieza.largo, pieza.ancho)
}

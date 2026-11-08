import { rotarBordes } from '@pachiplac/shared'
import { type Rect } from './geometria'
import { orientaciones, type Instancia, type Orientacion } from './piezas'
import type { OpcionesResueltas } from './opciones'
import { cabeEn, type TipoResuelto } from './hojas'
import type { Bordes } from './types'

export interface Colocacion {
  inst: Instancia
  x: number
  y: number
  w: number
  h: number
  rotada: boolean
}

export interface Plan {
  tipo: TipoResuelto
  colocaciones: Colocacion[]
  /** Huecos libres en coordenadas infladas (incluyen el kerf). */
  libres: Rect[]
}

export type PoliticaSplit = 'VERTICAL_PRIMERO' | 'HORIZONTAL_PRIMERO'
export type CriterioAjuste = 'SHORT_SIDE' | 'AREA'

export interface VarianteLibre {
  politica: PoliticaSplit
  criterio: CriterioAjuste
}

const EPS = 1e-6

export function crearPlan(tipo: TipoResuelto, kerf: number): Plan {
  return {
    tipo,
    colocaciones: [],
    libres: [{ x: 0, y: 0, w: tipo.usable.w + kerf, h: tipo.usable.h + kerf }],
  }
}

export function piezaColocada(c: Colocacion): {
  idPieza: string
  etiqueta?: string
  x: number
  y: number
  w: number
  h: number
  rotada: boolean
  bordes: Bordes
} {
  return {
    idPieza: c.inst.pieza.id,
    ...(c.inst.pieza.etiqueta !== undefined ? { etiqueta: c.inst.pieza.etiqueta } : {}),
    x: c.x,
    y: c.y,
    w: c.w,
    h: c.h,
    rotada: c.rotada,
    bordes: c.rotada ? rotarBordes(c.inst.pieza.bordes) : { ...c.inst.pieza.bordes },
  }
}

function puntajeHueco(
  rect: Rect,
  orient: Orientacion,
  kerf: number,
  criterio: CriterioAjuste,
): number[] | null {
  const wk = orient.w + kerf
  const hk = orient.h + kerf
  if (wk > rect.w + EPS || hk > rect.h + EPS) return null
  const sobraW = rect.w - wk
  const sobraH = rect.h - hk
  const ladoCorto = Math.min(sobraW, sobraH)
  const areaSobra = rect.w * rect.h - wk * hk
  return criterio === 'SHORT_SIDE'
    ? [ladoCorto, areaSobra, orient.rotada ? 1 : 0]
    : [areaSobra, ladoCorto, orient.rotada ? 1 : 0]
}

function compararPuntajes(a: number[], b: number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i] - b[i]
    if (Math.abs(diff) > EPS) return diff
  }
  return 0
}

interface Eleccion {
  plan: Plan
  rect: Rect
  orient: Orientacion
}

function elegirHueco(
  inst: Instancia,
  planes: readonly Plan[],
  opts: OpcionesResueltas,
  criterio: CriterioAjuste,
): Eleccion | null {
  let mejor: Eleccion | null = null
  let mejorPuntaje: number[] | null = null

  for (const plan of planes) {
    for (const rect of plan.libres) {
      for (const orient of orientaciones(inst.pieza)) {
        const puntaje = puntajeHueco(rect, orient, opts.kerf, criterio)
        if (!puntaje) continue
        if (!mejorPuntaje || compararPuntajes(puntaje, mejorPuntaje) < 0) {
          mejor = { plan, rect, orient }
          mejorPuntaje = puntaje
        }
      }
    }
  }

  return mejor
}

function ocuparHueco(
  eleccion: Eleccion,
  inst: Instancia,
  opts: OpcionesResueltas,
  politica: PoliticaSplit,
): void {
  const { plan, rect, orient } = eleccion
  const wk = orient.w + opts.kerf
  const hk = orient.h + opts.kerf

  const indice = plan.libres.indexOf(rect)
  if (indice >= 0) plan.libres.splice(indice, 1)

  plan.colocaciones.push({
    inst,
    x: rect.x,
    y: rect.y,
    w: orient.w,
    h: orient.h,
    rotada: orient.rotada,
  })

  if (politica === 'VERTICAL_PRIMERO') {
    if (rect.w - wk > EPS) {
      plan.libres.push({ x: rect.x + wk, y: rect.y, w: rect.w - wk, h: rect.h })
    }
    if (rect.h - hk > EPS) {
      plan.libres.push({ x: rect.x, y: rect.y + hk, w: wk, h: rect.h - hk })
    }
  } else {
    if (rect.h - hk > EPS) {
      plan.libres.push({ x: rect.x, y: rect.y + hk, w: rect.w, h: rect.h - hk })
    }
    if (rect.w - wk > EPS) {
      plan.libres.push({ x: rect.x + wk, y: rect.y, w: rect.w - wk, h: hk })
    }
  }
}

/**
 * Elige la hoja más barata en la que entre la pieza. A igual costo, la que
 * desperdicia menos superficie.
 */
export function elegirTipoNuevo(
  inst: Instancia,
  tipos: readonly TipoResuelto[],
): TipoResuelto | null {
  let mejor: TipoResuelto | null = null
  let mejorPuntaje: number[] | null = null

  for (const tipo of tipos) {
    for (const orient of orientaciones(inst.pieza)) {
      if (!cabeEn(tipo, orient.w, orient.h)) continue
      const areaPieza = orient.w * orient.h
      const puntaje = [tipo.costoMedias, tipo.usable.w * tipo.usable.h - areaPieza]
      if (!mejorPuntaje || compararPuntajes(puntaje, mejorPuntaje) < 0) {
        mejor = tipo
        mejorPuntaje = puntaje
      }
    }
  }

  return mejor
}

/**
 * Empaquetado guillotina libre: lista de rectángulos libres, mejor ajuste y
 * partición del sobrante en dos rectángulos por cada colocación.
 */
export function empaquetarLibre(
  instancias: readonly Instancia[],
  tipos: readonly TipoResuelto[],
  opts: OpcionesResueltas,
  variante: VarianteLibre,
): Plan[] | null {
  const planes: Plan[] = []

  for (const inst of instancias) {
    const hueco = elegirHueco(inst, planes, opts, variante.criterio)
    if (hueco) {
      ocuparHueco(hueco, inst, opts, variante.politica)
      continue
    }

    const tipo = elegirTipoNuevo(inst, tipos)
    if (!tipo) return null

    const orient = orientaciones(inst.pieza).find((o) => cabeEn(tipo, o.w, o.h))
    if (!orient) return null

    const plan = crearPlan(tipo, opts.kerf)
    planes.push(plan)
    ocuparHueco({ plan, rect: plan.libres[0], orient }, inst, opts, variante.politica)
  }

  return planes
}

export function costoMedias(planes: readonly Plan[]): number {
  return planes.reduce((total, plan) => total + plan.tipo.costoMedias, 0)
}

export function areaRetazoMayor(planes: readonly Plan[], kerf: number): number {
  let mayor = 0
  for (const plan of planes) {
    for (const rect of plan.libres) {
      mayor = Math.max(mayor, Math.max(0, rect.w - kerf) * Math.max(0, rect.h - kerf))
    }
  }
  return mayor
}

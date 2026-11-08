import { cabeEn, type TipoResuelto } from './hojas'
import { orientaciones, type Instancia } from './piezas'
import { crearPlan, type Colocacion, type Plan } from './packing'
import type { OpcionesResueltas } from './opciones'
import type { PiezaEntrada } from './types'

const EPS = 1e-6

interface ItemTira {
  inst: Instancia
  w: number
  h: number
  rotada: boolean
}

interface Tira {
  ancho: number
  items: ItemTira[]
}

interface TipoConOrigen extends TipoResuelto {
  origen: TipoResuelto
}

function anchosCandidatos(pieza: PiezaEntrada): number[] {
  const anchos = new Set<number>([pieza.largo])
  if (pieza.puedeRotar) anchos.add(pieza.ancho)
  return [...anchos]
}

/**
 * Agrupa piezas en tiras de ancho uniforme. En `DOS_ETAPAS` el primer corte
 * separa tiras que recorren toda la hoja y el segundo corte parte cada tira en
 * piezas, por eso todas las piezas de una tira comparten el ancho.
 */
function construirTiras(instancias: readonly Instancia[], kerf: number, alturaMax: number): Tira[] {
  const pendientes = new Set(instancias.map((i) => i.key))
  const tiras: Tira[] = []

  while (pendientes.size > 0) {
    const primeraClave = pendientes.values().next().value as string
    const primera = instancias.find((i) => i.key === primeraClave)
    if (!primera) break

    let mejor: { tira: Tira; area: number } | null = null

    for (const ancho of anchosCandidatos(primera.pieza)) {
      const items: ItemTira[] = []
      let altoUsado = 0

      for (const inst of instancias) {
        if (!pendientes.has(inst.key)) continue
        const orient = orientaciones(inst.pieza).find((o) => o.w === ancho)
        if (!orient) continue
        // altoUsado ya incluye el kerf de las piezas previas.
        if (altoUsado + orient.h + kerf > alturaMax + kerf + EPS) continue
        items.push({ inst, w: orient.w, h: orient.h, rotada: orient.rotada })
        altoUsado += orient.h + kerf
      }

      if (items.length === 0) continue
      const area = items.reduce((total, item) => total + item.w * item.h, 0)
      if (!mejor || area > mejor.area) mejor = { tira: { ancho, items }, area }
    }

    if (!mejor) {
      // No debería ocurrir: las piezas que no caben se filtran antes.
      pendientes.delete(primeraClave)
      continue
    }

    for (const item of mejor.tira.items) pendientes.delete(item.inst.key)
    tiras.push(mejor.tira)
  }

  return tiras
}

function elegirTipoParaTira(
  anchoTira: number,
  altoTira: number,
  tipos: readonly TipoResuelto[],
): TipoResuelto | null {
  let mejor: TipoResuelto | null = null
  let mejorPuntaje: number[] | null = null
  for (const tipo of tipos) {
    if (anchoTira > tipo.usable.w + EPS || altoTira > tipo.usable.h + EPS) continue
    const puntaje = [tipo.costoMedias, tipo.usable.w * tipo.usable.h]
    if (
      !mejorPuntaje ||
      puntaje[0] < mejorPuntaje[0] ||
      (puntaje[0] === mejorPuntaje[0] && puntaje[1] < mejorPuntaje[1])
    ) {
      mejor = tipo
      mejorPuntaje = puntaje
    }
  }
  return mejor
}

function empaquetarVertical(
  instancias: readonly Instancia[],
  tipos: readonly TipoResuelto[],
  opts: OpcionesResueltas,
): Plan[] | null {
  const alturaMax = Math.max(...tipos.map((t) => t.usable.h))
  const tiras = construirTiras(instancias, opts.kerf, alturaMax)
  const planes: Plan[] = []
  let actual: Plan | null = null
  let cursor = 0

  for (const tira of tiras) {
    const anchoInflado = tira.ancho + opts.kerf
    const altoInflado = tira.items.reduce((total, item) => total + item.h + opts.kerf, 0)

    const entraEnActual =
      actual !== null &&
      cursor + anchoInflado <= actual.tipo.usable.w + opts.kerf + EPS &&
      altoInflado - opts.kerf <= actual.tipo.usable.h + EPS

    if (!entraEnActual) {
      const tipo = elegirTipoParaTira(tira.ancho, altoInflado - opts.kerf, tipos)
      if (!tipo) return null
      actual = crearPlan(tipo, opts.kerf)
      actual.libres = []
      planes.push(actual)
      cursor = 0
    }

    const plan = actual as Plan
    let y = 0
    for (const item of tira.items) {
      const colocacion: Colocacion = {
        inst: item.inst,
        x: cursor,
        y,
        w: item.w,
        h: item.h,
        rotada: item.rotada,
      }
      plan.colocaciones.push(colocacion)
      y += item.h + opts.kerf
    }

    const alturaTotal = plan.tipo.usable.h + opts.kerf
    if (alturaTotal - y > EPS) {
      plan.libres.push({ x: cursor, y, w: anchoInflado, h: alturaTotal - y })
    }
    cursor += anchoInflado
  }

  for (const plan of planes) {
    const anchoTotal = plan.tipo.usable.w + opts.kerf
    const usado = plan.colocaciones.reduce((max, c) => Math.max(max, c.x + c.w + opts.kerf), 0)
    if (anchoTotal - usado > EPS) {
      plan.libres.push({ x: usado, y: 0, w: anchoTotal - usado, h: plan.tipo.usable.h + opts.kerf })
    }
  }

  return planes
}

function trasponerInstancia(inst: Instancia): Instancia {
  return {
    ...inst,
    pieza: { ...inst.pieza, largo: inst.pieza.ancho, ancho: inst.pieza.largo },
  }
}

function trasponerTipo(tipo: TipoResuelto): TipoConOrigen {
  return {
    ...tipo,
    largo: tipo.ancho,
    ancho: tipo.largo,
    usable: { w: tipo.usable.h, h: tipo.usable.w },
    origen: tipo,
  }
}

/**
 * Modo de dos etapas: tiras que recorren la hoja en una dirección y cortes
 * perpendiculares dentro de cada tira.
 */
export function empaquetarDosEtapas(
  instancias: readonly Instancia[],
  tipos: readonly TipoResuelto[],
  opts: OpcionesResueltas,
  orientacion: 'VERTICAL' | 'HORIZONTAL',
): Plan[] | null {
  if (orientacion === 'VERTICAL') return empaquetarVertical(instancias, tipos, opts)

  const originales = new Map(instancias.map((i) => [i.key, i]))
  const transpuestas = instancias.map(trasponerInstancia)
  const tiposTranspuestos = tipos.map(trasponerTipo)

  const planes = empaquetarVertical(transpuestas, tiposTranspuestos, opts)
  if (!planes) return null

  return planes.map((plan) => ({
    tipo: (plan.tipo as TipoConOrigen).origen,
    colocaciones: plan.colocaciones.map((c) => ({
      inst: originales.get(c.inst.key) ?? c.inst,
      x: c.y,
      y: c.x,
      w: c.h,
      h: c.w,
      rotada: c.rotada,
    })),
    libres: plan.libres.map((r) => ({ x: r.y, y: r.x, w: r.h, h: r.w })),
  }))
}

/** Verifica que la pieza entre en al menos un tipo de hoja (con rotación). */
export function cabeEnAlgunaHoja(pieza: PiezaEntrada, tipos: readonly TipoResuelto[]): boolean {
  return tipos.some((tipo) => orientaciones(pieza).some((o) => cabeEn(tipo, o.w, o.h)))
}

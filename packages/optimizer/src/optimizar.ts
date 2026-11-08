import { calcularMetrosCinta, redondear } from '@pachiplac/shared'
import { barajar, crearRng } from './geometria'
import { resolverTipos, type TipoResuelto, cabeEn } from './hojas'
import { cabeEnAlgunaHoja, empaquetarDosEtapas } from './dos-etapas'
import {
  areaPieza,
  expandirPiezas,
  ladoMayor,
  ladoMenor,
  orientaciones,
  type Instancia,
} from './piezas'
import {
  areaRetazoMayor,
  empaquetarLibre,
  piezaColocada,
  type Plan,
  type VarianteLibre,
} from './packing'
import { resolverOpciones } from './opciones'
import { generarCortes } from './cortes'
import type {
  HojaDisponible,
  HojaResultado,
  OpcionesOptimizacion,
  PiezaEntrada,
  ResultadoOptimizacion,
} from './types'

const VARIANTES_LIBRE: VarianteLibre[] = [
  { politica: 'VERTICAL_PRIMERO', criterio: 'SHORT_SIDE' },
  { politica: 'VERTICAL_PRIMERO', criterio: 'AREA' },
  { politica: 'HORIZONTAL_PRIMERO', criterio: 'SHORT_SIDE' },
  { politica: 'HORIZONTAL_PRIMERO', criterio: 'AREA' },
]

const MEZCLAS_ALEATORIAS = 8

type ClaveOrden = 'area' | 'ladoMayor' | 'ladoMenor' | 'largo' | 'ancho'

function claveOrden(nombre: ClaveOrden, inst: Instancia): number {
  const { pieza } = inst
  switch (nombre) {
    case 'area':
      return areaPieza(pieza)
    case 'ladoMayor':
      return ladoMayor(pieza)
    case 'ladoMenor':
      return ladoMenor(pieza)
    case 'largo':
      return pieza.largo
    case 'ancho':
      return pieza.ancho
  }
}

function compararClave(a: Instancia, b: Instancia): number {
  if (a.key < b.key) return -1
  if (a.key > b.key) return 1
  return 0
}

function ordenar(nombre: ClaveOrden, instancias: readonly Instancia[]): Instancia[] {
  return [...instancias].sort(
    (a, b) =>
      claveOrden(nombre, b) - claveOrden(nombre, a) ||
      areaPieza(b.pieza) - areaPieza(a.pieza) ||
      compararClave(a, b),
  )
}

function variantesLibre(primerCorte: OpcionesOptimizacion['primerCorte']): VarianteLibre[] {
  if (primerCorte === 'VERTICAL') {
    return VARIANTES_LIBRE.filter((v) => v.politica === 'VERTICAL_PRIMERO')
  }
  if (primerCorte === 'HORIZONTAL') {
    return VARIANTES_LIBRE.filter((v) => v.politica === 'HORIZONTAL_PRIMERO')
  }
  return VARIANTES_LIBRE
}

function orientacionesDosEtapas(
  primerCorte: OpcionesOptimizacion['primerCorte'],
): Array<'VERTICAL' | 'HORIZONTAL'> {
  if (primerCorte === 'VERTICAL') return ['VERTICAL']
  if (primerCorte === 'HORIZONTAL') return ['HORIZONTAL']
  return ['VERTICAL', 'HORIZONTAL']
}

function construirIntentos(
  instancias: readonly Instancia[],
  tipos: readonly TipoResuelto[],
  opts: ReturnType<typeof resolverOpciones>,
): Array<() => Plan[] | null> {
  const intentos: Array<() => Plan[] | null> = []
  const rng = crearRng(opts.semilla)
  const bases: Instancia[][] = []
  const tiposEntera = tipos.filter((t) => t.tipo === 'ENTERA')

  for (const nombre of ['area', 'ladoMayor', 'ladoMenor', 'largo', 'ancho'] as const) {
    bases.push(ordenar(nombre, instancias))
  }
  for (let i = 0; i < MEZCLAS_ALEATORIAS; i++) bases.push(barajar(instancias, rng))

  for (const base of bases) {
    if (opts.modoCorte === 'GUILLOTINA_LIBRE') {
      for (const variante of variantesLibre(opts.primerCorte)) {
        // Estrategia directa: puede abrir medias hojas desde el principio.
        intentos.push(() => empaquetarLibre(base, tipos, opts, variante))
        // Estrategia "enteras primero": empaqueta en hojas enteras y el
        // refinado posterior intenta bajar cada una a media hoja.
        if (tipos.some((t) => t.tipo === 'ENTERA')) {
          intentos.push(() => empaquetarLibre(base, tiposEntera, opts, variante))
        }
      }
    } else {
      for (const orientacion of orientacionesDosEtapas(opts.primerCorte)) {
        intentos.push(() => empaquetarDosEtapas(base, tipos, opts, orientacion))
        if (tipos.some((t) => t.tipo === 'ENTERA')) {
          intentos.push(() => empaquetarDosEtapas(base, tiposEntera, opts, orientacion))
        }
      }
    }
  }

  return intentos
}

function retazoMayorDe(plan: Plan, kerf: number): { w: number; h: number } {
  let mejor = { w: 0, h: 0 }
  for (const rect of plan.libres) {
    const w = Math.max(0, rect.w - kerf)
    const h = Math.max(0, rect.h - kerf)
    if (w * h > mejor.w * mejor.h) mejor = { w, h }
  }
  return mejor
}

function empaquetarUnaHoja(
  instancias: readonly Instancia[],
  tipo: TipoResuelto,
  opts: ReturnType<typeof resolverOpciones>,
): Plan | null {
  const ordenes = [ordenar('area', instancias), ordenar('ladoMayor', instancias)]
  let mejor: Plan | null = null

  const probar = (planes: Plan[] | null): void => {
    const plan = planes?.[0]
    if (!plan || planes?.length !== 1) return
    if (plan.colocaciones.length !== instancias.length) return
    if (!mejor || areaRetazoMayor([plan], opts.kerf) > areaRetazoMayor([mejor], opts.kerf)) {
      mejor = plan
    }
  }

  if (opts.modoCorte === 'GUILLOTINA_LIBRE') {
    for (const orden of ordenes) {
      for (const variante of VARIANTES_LIBRE) {
        if (mejor) break
        probar(empaquetarLibre(orden, [tipo], opts, variante))
      }
    }
  } else {
    for (const orden of ordenes) {
      for (const orientacion of orientacionesDosEtapas(opts.primerCorte)) {
        if (mejor) break
        probar(empaquetarDosEtapas(orden, [tipo], opts, orientacion))
      }
    }
  }

  return mejor
}

/**
 * Baja hojas enteras a media hoja cuando todas sus piezas caben en una media
 * (a lo largo o a lo ancho), reduciendo el costo en una media por hoja.
 */
function bajarAMedia(
  planes: readonly Plan[],
  tipos: readonly TipoResuelto[],
  opts: ReturnType<typeof resolverOpciones>,
): Plan[] {
  const medias = tipos.filter((t) => t.tipo !== 'ENTERA')
  if (medias.length === 0) return [...planes]

  return planes.map((plan) => {
    if (plan.tipo.tipo !== 'ENTERA') return plan
    const instancias = plan.colocaciones.map((c) => c.inst)
    let mejor: Plan | null = null
    for (const media of medias) {
      const candidato = empaquetarUnaHoja(instancias, media, opts)
      if (candidato) mejor = candidato
    }
    return mejor ?? plan
  })
}

interface Candidato {
  hojas: HojaResultado[]
  totalMedias: number
  retazoArea: number
  totalCortes: number
}

function evaluar(planes: readonly Plan[], opts: ReturnType<typeof resolverOpciones>): Candidato {
  const hojas: HojaResultado[] = []
  let totalCortes = 0

  for (const plan of planes) {
    const piezas = plan.colocaciones.map(piezaColocada)
    const cortes = generarCortes(piezas, plan.tipo.usable, opts.kerf)
    totalCortes += cortes.length
    const areaPiezas = piezas.reduce((total, p) => total + p.w * p.h, 0)
    const areaUtil = plan.tipo.usable.w * plan.tipo.usable.h
    hojas.push({
      tipo: plan.tipo.tipo,
      largo: plan.tipo.largo,
      ancho: plan.tipo.ancho,
      piezas,
      cortes,
      aprovechamiento: redondear(areaPiezas / areaUtil, 4),
      retazoMayor: retazoMayorDe(plan, opts.kerf),
    })
  }

  return {
    hojas,
    totalMedias: planes.reduce((total, plan) => total + plan.tipo.costoMedias, 0),
    retazoArea: areaRetazoMayor(planes, opts.kerf),
    totalCortes,
  }
}

function esMejor(candidato: Candidato, actual: Candidato | null): boolean {
  if (!actual) return true
  if (candidato.totalMedias !== actual.totalMedias)
    return candidato.totalMedias < actual.totalMedias
  if (Math.abs(candidato.retazoArea - actual.retazoArea) > 1e-6) {
    return candidato.retazoArea > actual.retazoArea
  }
  return candidato.totalCortes < actual.totalCortes
}

/**
 * Optimiza el corte de un conjunto de piezas sobre las hojas disponibles.
 *
 * Objetivos, en orden: menor costo en medias hojas, mayor retazo aprovechable
 * y menos cortes. Respeta kerf, refilado, rotación libre y media hoja.
 */
export function optimizar(
  piezas: readonly PiezaEntrada[],
  hojas: readonly HojaDisponible[],
  opciones: Partial<OpcionesOptimizacion> = {},
): ResultadoOptimizacion {
  const opts = resolverOpciones(opciones)
  const tipos = resolverTipos(hojas, opts.refilado_mm)
  const instancias = expandirPiezas(piezas)
  const metrosCinta = calcularMetrosCinta(piezas)

  const noCaben = new Set<string>()
  const aptas: Instancia[] = []
  for (const inst of instancias) {
    if (cabeEnAlgunaHoja(inst.pieza, tipos)) aptas.push(inst)
    else noCaben.add(inst.pieza.id)
  }

  if (aptas.length === 0) {
    return { hojas: [], totalMedias: 0, metrosCinta, noCaben: [...noCaben] }
  }

  const inicio = Date.now()
  let mejor: Candidato | null = null
  let intentos = 0

  for (const intento of construirIntentos(aptas, tipos, opts)) {
    if (intentos > 0 && Date.now() - inicio > opts.tiempoMaxMs) break
    intentos++

    const planes = intento()
    if (!planes || planes.length === 0) continue

    const refinados = bajarAMedia(planes, tipos, opts)
    const candidato = evaluar(refinados, opts)
    if (esMejor(candidato, mejor)) mejor = candidato
  }

  if (!mejor) {
    throw new Error('No se pudo encontrar una distribución válida para las piezas')
  }

  return { hojas: mejor.hojas, totalMedias: mejor.totalMedias, metrosCinta, noCaben: [...noCaben] }
}

export { orientaciones, cabeEn }

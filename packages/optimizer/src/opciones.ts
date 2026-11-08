import type { ModoCorte, OpcionesOptimizacion, PrimerCorte } from './types'

export const KERF_DEFAULT = 4
export const REFILADO_DEFAULT = 5
export const TIEMPO_MAX_DEFAULT = 1000
export const SEMILLA_DEFAULT = 20260101

export interface OpcionesResueltas {
  kerf: number
  refilado_mm: number
  modoCorte: ModoCorte
  primerCorte: PrimerCorte
  tiempoMaxMs: number
  semilla: number
}

function numeroValido(valor: unknown, nombre: string, minimo: number, estricto = false): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new TypeError(`${nombre} debe ser un número finito (recibido: ${String(valor)})`)
  }
  if (estricto ? valor <= minimo : valor < minimo) {
    throw new RangeError(
      `${nombre} debe ser ${estricto ? '>' : '>='} ${minimo} (recibido: ${valor})`,
    )
  }
  return valor
}

export function resolverOpciones(opciones: Partial<OpcionesOptimizacion> = {}): OpcionesResueltas {
  const modoCorte = opciones.modoCorte ?? 'GUILLOTINA_LIBRE'
  const primerCorte = opciones.primerCorte ?? 'AUTO'

  if (modoCorte !== 'DOS_ETAPAS' && modoCorte !== 'GUILLOTINA_LIBRE') {
    throw new RangeError(`modoCorte inválido: ${String(modoCorte)}`)
  }
  if (primerCorte !== 'VERTICAL' && primerCorte !== 'HORIZONTAL' && primerCorte !== 'AUTO') {
    throw new RangeError(`primerCorte inválido: ${String(primerCorte)}`)
  }

  return {
    kerf: numeroValido(opciones.kerf ?? KERF_DEFAULT, 'kerf', 0),
    refilado_mm: numeroValido(opciones.refilado_mm ?? REFILADO_DEFAULT, 'refilado_mm', 0),
    modoCorte,
    primerCorte,
    tiempoMaxMs: numeroValido(opciones.tiempoMaxMs ?? TIEMPO_MAX_DEFAULT, 'tiempoMaxMs', 0, true),
    semilla: Math.trunc(opciones.semilla ?? SEMILLA_DEFAULT),
  }
}

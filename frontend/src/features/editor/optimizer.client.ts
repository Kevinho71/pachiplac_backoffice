import { wrap } from 'comlink'

import type {
  HojaDisponible,
  OpcionesOptimizacion,
  PiezaEntrada,
  ResultadoOptimizacion,
} from '@pachiplac/optimizer'

import type { OptimizadorWorker } from './optimizer.worker'

let worker: Worker | null = null
let api: ReturnType<typeof wrap<OptimizadorWorker>> | null = null

function obtenerApi(): ReturnType<typeof wrap<OptimizadorWorker>> {
  if (!api) {
    worker = new Worker(new URL('./optimizer.worker.ts', import.meta.url), { type: 'module' })
    api = wrap<OptimizadorWorker>(worker)
  }
  return api
}

/** Ejecuta el optimizador en el Web Worker (promesa serializable por Comlink). */
export function optimizarEnWorker(
  piezas: readonly PiezaEntrada[],
  hojas: readonly HojaDisponible[],
  opciones: Partial<OpcionesOptimizacion>,
): Promise<ResultadoOptimizacion> {
  return obtenerApi().optimizar(piezas, hojas, opciones)
}

/** Libera el worker (útil en HMR o al desmontar la app). */
export function cerrarOptimizador(): void {
  worker?.terminate()
  worker = null
  api = null
}

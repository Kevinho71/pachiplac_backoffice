import { expose } from 'comlink'

import { optimizar } from '@pachiplac/optimizer'

/**
 * Web Worker del optimizador. Corre el algoritmo fuera del hilo principal para
 * que la pantalla no se congele mientras busca la mejor distribución.
 */
const api = { optimizar }

export type OptimizadorWorker = typeof api

expose(api)

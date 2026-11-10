import type { Lado } from '@pachiplac/shared'
import type { ModoCorte, PrimerCorte, ResultadoOptimizacion } from '@pachiplac/optimizer'

/** Cinta por lado, con `null` explícito cuando el lado no lleva cinta. */
export type BordesEditor = Record<Lado, string | null>

/** Pieza tal como se edita en la pantalla (medidas en mm). */
export interface PiezaEditor {
  id: string
  etiqueta: string
  largo: number
  ancho: number
  cantidad: number
  puedeRotar: boolean
  bordes: BordesEditor
}

/** Parámetros de la hoja y del corte. */
export interface OpcionesEditor {
  material: string
  hojaLargoMm: number
  hojaAnchoMm: number
  kerf: number
  refiladoMm: number
  modoCorte: ModoCorte
  primerCorte: PrimerCorte
  tiempoMaxMs: number
  semilla: number
}

export type EstadoOptimizacion = 'inactivo' | 'calculando' | 'listo' | 'error'

export interface ResultadoEditor {
  resultado: ResultadoOptimizacion
  /** Momento en que se calculó, para mostrar frescura. */
  calculadoEn: Date
}

import type { Bordes, Lado } from '@pachiplac/shared'

export type { Bordes, Lado }

/** Pieza pedida por el cliente (contrato 6.1). Medidas en mm. */
export interface PiezaEntrada {
  id: string
  etiqueta?: string
  /** Medida en el sentido de la veta (horizontal). */
  largo: number
  ancho: number
  /** Cuántas piezas iguales se necesitan. */
  cantidad: number
  /** Rotación = intercambiar largo ↔ ancho. */
  puedeRotar: boolean
  /** Color de cinta por lado, o ausente si ese lado no lleva cinta. */
  bordes: Bordes
}

export type TipoHoja = 'ENTERA' | 'MEDIA_LARGA' | 'MEDIA_ANCHA'

export interface HojaDisponible {
  tipo: TipoHoja
  /** mm */
  largo: number
  /** mm */
  ancho: number
  /** 2 para hoja entera, 1 para media hoja. */
  costoMedias: number
}

export type ModoCorte = 'DOS_ETAPAS' | 'GUILLOTINA_LIBRE'
export type PrimerCorte = 'VERTICAL' | 'HORIZONTAL' | 'AUTO'

export interface OpcionesOptimizacion {
  /** Grosor de la sierra, mm. Por defecto 4. */
  kerf: number
  /** Margen que se recorta de cada lado de la hoja, mm. Por defecto 5 (0 = sin refilar). */
  refilado_mm: number
  modoCorte: ModoCorte
  primerCorte: PrimerCorte
  /** Presupuesto de búsqueda, ms. */
  tiempoMaxMs: number
  /** Semilla para que la búsqueda aleatoria sea reproducible. */
  semilla?: number
}

/** Pieza ya ubicada en una hoja, en coordenadas de la superficie útil. */
export interface PiezaColocada {
  idPieza: string
  etiqueta?: string
  /** mm desde el borde izquierdo de la superficie útil. */
  x: number
  /** mm desde el borde superior de la superficie útil. */
  y: number
  /** Dimensiones ya orientadas. */
  w: number
  h: number
  rotada: boolean
  /** Bordes ya rotados a la orientación colocada. */
  bordes: Bordes
}

export interface Corte {
  /** Orden de ejecución, empezando en 1. */
  n: number
  orientacion: 'V' | 'H'
  /**
   * Distancia en mm desde el borde izquierdo (`V`) o superior (`H`) de la
   * superficie útil de la hoja.
   */
  posicion: number
  /** Inicio del tramo que recorre el corte, mm. */
  desde: number
  /** Fin del tramo que recorre el corte, mm. */
  hasta: number
}

export interface Retazo {
  w: number
  h: number
}

export interface HojaResultado {
  tipo: TipoHoja
  largo: number
  ancho: number
  piezas: PiezaColocada[]
  cortes: Corte[]
  /** Área de piezas / área útil de la hoja, 0..1. */
  aprovechamiento: number
  /** Sobrante rectangular más grande que queda en la hoja. */
  retazoMayor: Retazo
}

export interface ResultadoOptimizacion {
  hojas: HojaResultado[]
  /** Costo total en medias hojas (entera = 2, media = 1). */
  totalMedias: number
  metrosCinta: {
    total: number
    porColor: Record<string, number>
  }
  /** ids de piezas que no caben en ninguna hoja disponible. */
  noCaben: string[]
}

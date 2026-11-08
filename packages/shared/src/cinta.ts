import { LADOS, type Bordes, type Lado } from './lados'

export interface PiezaParaCinta {
  largo: number
  ancho: number
  cantidad: number
  bordes: Bordes
}

export interface MetrosCinta {
  total: number
  porColor: Record<string, number>
}

/** Redondeo comercial a `decimales` (half-up sobre el valor absoluto). */
export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales
  const signo = valor < 0 ? -1 : 1
  return (signo * Math.round(Math.abs(valor) * factor + Number.EPSILON)) / factor
}

/** Longitud en mm de un lado, según la orientación original de la pieza. */
export function largoDeLado(lado: Lado, largo: number, ancho: number): number {
  return lado === 'sup' || lado === 'inf' ? largo : ancho
}

/**
 * Metros de cinta por color y en total (especificación 5.9).
 *
 * `metros = Σ piezas (cantidad × Σ longitud de cada lado con cinta) / 1000`
 *
 * Es independiente de si la pieza se rota en el esquema: los lados rotan con
 * ella y la suma por color no cambia. La usan el navegador y el backend.
 */
export function calcularMetrosCinta(piezas: readonly PiezaParaCinta[]): MetrosCinta {
  let totalMm = 0
  const porColorMm = new Map<string, number>()

  for (const pieza of piezas) {
    if (!Number.isFinite(pieza.cantidad) || pieza.cantidad <= 0) continue
    for (const lado of LADOS) {
      const color = pieza.bordes[lado]
      if (!color) continue
      const mm = largoDeLado(lado, pieza.largo, pieza.ancho) * pieza.cantidad
      totalMm += mm
      porColorMm.set(color, (porColorMm.get(color) ?? 0) + mm)
    }
  }

  const porColor: Record<string, number> = {}
  for (const [color, mm] of porColorMm) {
    porColor[color] = redondear(mm / 1000, 2)
  }

  return { total: redondear(totalMm / 1000, 2), porColor }
}

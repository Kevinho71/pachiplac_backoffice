import type { HojaResultado } from '@pachiplac/optimizer'
import { calcularMetrosCinta, type MetrosCinta } from '@pachiplac/shared'

/**
 * Metros de cinta de una hoja ya optimizada. Se recalcula desde las piezas
 * colocadas, con la misma función compartida que usa el backend.
 */
export function metrosDeHoja(hoja: HojaResultado): MetrosCinta {
  return calcularMetrosCinta(
    hoja.piezas.map((pieza) => ({
      largo: pieza.w,
      ancho: pieza.h,
      cantidad: 1,
      bordes: pieza.bordes,
    })),
  )
}

/** Colores de cinta presentes en una hoja, en orden de aparición. */
export function coloresDeHoja(hoja: HojaResultado): string[] {
  const colores = new Set<string>()
  for (const pieza of hoja.piezas) {
    for (const color of Object.values(pieza.bordes)) {
      if (color) colores.add(color)
    }
  }
  return [...colores]
}

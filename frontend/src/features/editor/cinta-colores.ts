/**
 * Paleta de cintas de canto. Los nombres son los que se guardan en el esquema
 * (`bordes`), y el hex es solo para dibujar la línea de cinta.
 */
export interface ColorCinta {
  nombre: string
  hex: string
  /** Borde visible para colores claros (blanco) sobre papel. */
  borde?: string
  /** Color de texto legible sobre el swatch. */
  texto?: string
}

export const COLORES_CINTA: readonly ColorCinta[] = [
  { nombre: 'Blanco', hex: '#ffffff', borde: '#b9b3a6', texto: '#1c1a16' },
  { nombre: 'Negro', hex: '#1d1c1a', texto: '#ffffff' },
  { nombre: 'Gris', hex: '#9d9a92', texto: '#ffffff' },
  { nombre: 'Natural', hex: '#dcb887', texto: '#1c1a16' },
  { nombre: 'Roble', hex: '#b17a44', texto: '#ffffff' },
  { nombre: 'Nogal', hex: '#7c512d', texto: '#ffffff' },
  { nombre: 'Wengue', hex: '#3d2a1f', texto: '#ffffff' },
  { nombre: 'Verde', hex: '#4f7a5b', texto: '#ffffff' },
  { nombre: 'Azul', hex: '#3f6f9a', texto: '#ffffff' },
  { nombre: 'Rojo', hex: '#a53b30', texto: '#ffffff' },
] as const

const POR_NOMBRE = new Map(COLORES_CINTA.map((color) => [color.nombre, color]))

const FALLBACK: ColorCinta = { nombre: 'Otro', hex: '#8a8478', texto: '#ffffff' }

/** Devuelve el color de una cinta por nombre; si no se conoce, un gris neutro. */
export function colorDeCinta(nombre: string | null | undefined): ColorCinta {
  if (!nombre) return FALLBACK
  return POR_NOMBRE.get(nombre) ?? FALLBACK
}

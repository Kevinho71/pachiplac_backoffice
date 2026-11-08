export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Dimensiones {
  w: number
  h: number
}

export function area(r: Dimensiones): number {
  return r.w * r.h
}

export function areaRect(r: Rect): number {
  return r.w * r.h
}

export function seSolapan(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

export function contiene(contenedor: Rect, interior: Rect): boolean {
  return (
    interior.x >= contenedor.x &&
    interior.y >= contenedor.y &&
    interior.x + interior.w <= contenedor.x + contenedor.w &&
    interior.y + interior.h <= contenedor.y + contenedor.h
  )
}

/** Generador pseudoaleatorio reproducible (mulberry32). */
export function crearRng(semilla: number): () => number {
  let estado = semilla >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function barajar<T>(items: readonly T[], rng: () => number): T[] {
  const copia = [...items]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temporal = copia[i]
    copia[i] = copia[j]
    copia[j] = temporal
  }
  return copia
}

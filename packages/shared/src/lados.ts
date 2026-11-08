/**
 * Lados de una pieza, definidos respecto a la pieza tal como la ingresó el dueño
 * (largo × ancho): `sup` e `inf` son los lados de longitud `largo`; `izq` y `der`
 * los de longitud `ancho`. Ver especificación, sección 5.9.
 */
export type Lado = 'sup' | 'inf' | 'izq' | 'der'

export const LADOS: readonly Lado[] = ['sup', 'der', 'inf', 'izq']

/** Color de cinta por lado. Un lado ausente (o con valor falsy) no lleva cinta. */
export type Bordes = Partial<Record<Lado, string>>

/**
 * Rota los bordes 90° en sentido horario, para acompañar a una pieza rotada
 * (`largo ↔ ancho`). La rotación es la misma que aplica el optimizador.
 */
export function rotarBordes(bordes: Bordes): Bordes {
  return {
    sup: bordes.izq,
    der: bordes.sup,
    inf: bordes.der,
    izq: bordes.inf,
  }
}

import {
  ESQUEMA_VERSION,
  LADOS,
  bordesAOptimizador,
  bordesDesdeOptimizador,
  calcularMetrosCinta,
  cintaAEsquema,
  rotarBordes,
  type EsquemaCorte,
  type HojaEsquema,
  type Lado,
} from '@pachiplac/shared'
import type { HojaResultado, ResultadoOptimizacion } from '@pachiplac/optimizer'

import type { BordesEditor, OpcionesEditor, PiezaEditor } from '@/features/editor/editor.types'
import type { SeccionEsquemaDraft } from './tipos'

function bordesEditor(bordes: Partial<Record<Lado, string | null>>): BordesEditor {
  const resultado = {} as BordesEditor
  for (const lado of LADOS) {
    resultado[lado] = bordes[lado] ?? null
  }
  return resultado
}

/** Convierte el resultado en memoria del optimizador al JSON persistible (sección 8). */
export function construirEsquemaDeSeccion(
  resultado: ResultadoOptimizacion,
  opciones: OpcionesEditor,
  productoId: number,
): EsquemaCorte {
  return {
    version: ESQUEMA_VERSION,
    kerf_mm: opciones.kerf,
    refilado_mm: opciones.refiladoMm,
    modo: opciones.modoCorte,
    secciones: [
      {
        producto_id: productoId,
        hojas: resultado.hojas.map((hoja) => ({
          tipo: hoja.tipo,
          largo_mm: hoja.largo,
          ancho_mm: hoja.ancho,
          piezas: hoja.piezas.map((pieza) => ({
            id: pieza.idPieza,
            ...(pieza.etiqueta ? { etiqueta: pieza.etiqueta } : {}),
            x: pieza.x,
            y: pieza.y,
            w: pieza.w,
            h: pieza.h,
            rotada: pieza.rotada,
            bordes: bordesDesdeOptimizador(pieza.bordes),
          })),
          cortes: hoja.cortes,
        })),
      },
    ],
    cinta: cintaAEsquema(resultado.metrosCinta),
  }
}

/**
 * Reconstruye las piezas editables desde un esquema guardado. Cada copia se
 * agrupa por `id`; si estaba rotada se deshace la rotación (dimensiones y
 * bordes) para volver a la orientación original del dueño.
 */
export function reconstruirPiezasDeEsquema(esquema: EsquemaCorte): PiezaEditor[] {
  const porId = new Map<string, PiezaEditor>()

  for (const seccion of esquema.secciones) {
    for (const hoja of seccion.hojas) {
      for (const pieza of hoja.piezas) {
        const bordes = pieza.rotada
          ? rotarBordes(rotarBordes(rotarBordes(bordesAOptimizador(pieza.bordes))))
          : bordesAOptimizador(pieza.bordes)
        const existente = porId.get(pieza.id)
        if (existente) {
          existente.cantidad += 1
          continue
        }
        porId.set(pieza.id, {
          id: pieza.id,
          etiqueta: pieza.etiqueta ?? '',
          largo: pieza.rotada ? pieza.h : pieza.w,
          ancho: pieza.rotada ? pieza.w : pieza.h,
          cantidad: 1,
          puedeRotar: true,
          bordes: bordesEditor(bordes),
        })
      }
    }
  }

  return [...porId.values()]
}

/** Suma las secciones de una venta en un único JSON (el que se persiste). */
export function combinarSecciones(secciones: readonly SeccionEsquemaDraft[]): EsquemaCorte | null {
  if (secciones.length === 0) return null
  const base = secciones[0]?.esquema
  if (!base) return null

  const todasLasPiezas = secciones.flatMap((seccion) =>
    seccion.esquema.secciones.flatMap((bloque) =>
      bloque.hojas.flatMap((hoja) =>
        hoja.piezas.map((pieza) => ({
          largo: pieza.w,
          ancho: pieza.h,
          cantidad: 1,
          bordes: bordesAOptimizador(pieza.bordes),
        })),
      ),
    ),
  )

  return {
    version: base.version,
    kerf_mm: base.kerf_mm,
    refilado_mm: base.refilado_mm,
    modo: base.modo,
    secciones: secciones.flatMap((seccion) => seccion.esquema.secciones),
    cinta: cintaAEsquema(calcularMetrosCinta(todasLasPiezas)),
  }
}

/** Adapta una hoja persistida al tipo que dibuja `EsquemaSvg`. */
export function hojaEsquemaParaSvg(hoja: HojaEsquema): HojaResultado {
  const areaPiezas = hoja.piezas.reduce((total, pieza) => total + pieza.w * pieza.h, 0)
  const areaHoja = hoja.largo_mm * hoja.ancho_mm
  return {
    tipo: hoja.tipo,
    largo: hoja.largo_mm,
    ancho: hoja.ancho_mm,
    piezas: hoja.piezas.map((pieza) => ({
      idPieza: pieza.id,
      ...(pieza.etiqueta ? { etiqueta: pieza.etiqueta } : {}),
      x: pieza.x,
      y: pieza.y,
      w: pieza.w,
      h: pieza.h,
      rotada: pieza.rotada,
      bordes: bordesAOptimizador(pieza.bordes),
    })),
    cortes: hoja.cortes,
    aprovechamiento: areaHoja > 0 ? areaPiezas / areaHoja : 0,
    retazoMayor: { w: 0, h: 0 },
  }
}

/** Metros de cinta de una hoja persistida, con la función compartida (5.9). */
export function cintaDeHojaEsquema(hoja: HojaEsquema) {
  return calcularMetrosCinta(
    hoja.piezas.map((pieza) => ({
      largo: pieza.w,
      ancho: pieza.h,
      cantidad: 1,
      bordes: bordesAOptimizador(pieza.bordes),
    })),
  )
}

/** Total de medias hojas (costo) de un esquema, usado al rotular la sección. */
export function totalMediasDeEsquema(esquema: EsquemaCorte): number {
  return esquema.secciones.reduce(
    (total, seccion) =>
      total +
      seccion.hojas.reduce((suma, hoja) => suma + (hoja.tipo === 'ENTERA' ? 2 : 1), 0),
    0,
  )
}

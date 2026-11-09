import { z } from 'zod'

import type { MetrosCinta } from './cinta'
import { LADOS, type Bordes } from './lados'

/**
 * Contratos del **esquema de cortes** que se guarda en `ventas.esquema` (sección 8
 * de la especificación). Es un JSON de instantánea, distinto del resultado en memoria
 * del optimizador (sección 6.1), pero coherente con él: los nombres de los tipos de
 * hoja y del modo de corte coinciden, y se incluyen conversores en ambos sentidos.
 */

export const ESQUEMA_VERSION = 1

export const TIPO_HOJA = ['ENTERA', 'MEDIA_LARGA', 'MEDIA_ANCHA'] as const
export type TipoHoja = (typeof TIPO_HOJA)[number]

export const MODO_CORTE = ['DOS_ETAPAS', 'GUILLOTINA_LIBRE'] as const
export type ModoCorte = (typeof MODO_CORTE)[number]

export const ORIENTACION_CORTE = ['V', 'H'] as const
export type OrientacionCorte = (typeof ORIENTACION_CORTE)[number]

/**
 * Bordes en el JSON persistido: los cuatro lados siempre presentes, `null` cuando
 * ese lado no lleva cinta. Se distingue del `Bordes` del optimizador (lados ausentes).
 */
export const bordesEsquemaSchema = z.object({
  sup: z.string().nullable(),
  inf: z.string().nullable(),
  izq: z.string().nullable(),
  der: z.string().nullable(),
})
export type BordesEsquema = z.infer<typeof bordesEsquemaSchema>

/** Convierte los bordes del optimizador (lado ausente = sin cinta) al formato del JSON. */
export function bordesDesdeOptimizador(bordes: Bordes): BordesEsquema {
  return {
    sup: bordes.sup ?? null,
    inf: bordes.inf ?? null,
    izq: bordes.izq ?? null,
    der: bordes.der ?? null,
  }
}

/** Convierte el formato del JSON al `Bordes` parcial que espera el optimizador. */
export function bordesAOptimizador(bordes: BordesEsquema): Bordes {
  const resultado: Bordes = {}
  for (const lado of LADOS) {
    const color = bordes[lado]
    if (color) {
      resultado[lado] = color
    }
  }
  return resultado
}

export const corteEsquemaSchema = z.object({
  /** Orden de ejecución, empezando en 1. */
  n: z.number().int().positive(),
  orientacion: z.enum(ORIENTACION_CORTE),
  /** Distancia en mm desde el borde del sub-tablero. */
  posicion: z.number().nonnegative(),
  desde: z.number().nonnegative(),
  hasta: z.number().nonnegative(),
})
export type CorteEsquema = z.infer<typeof corteEsquemaSchema>

export const piezaEsquemaSchema = z.object({
  id: z.string().min(1),
  etiqueta: z.string().optional(),
  /** mm, esquina superior izquierda de la superficie útil. */
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  /** Dimensiones ya orientadas. */
  w: z.number().positive(),
  h: z.number().positive(),
  rotada: z.boolean(),
  bordes: bordesEsquemaSchema,
})
export type PiezaEsquema = z.infer<typeof piezaEsquemaSchema>

export const hojaEsquemaSchema = z.object({
  tipo: z.enum(TIPO_HOJA),
  largo_mm: z.number().positive(),
  ancho_mm: z.number().positive(),
  piezas: z.array(piezaEsquemaSchema),
  cortes: z.array(corteEsquemaSchema),
})
export type HojaEsquema = z.infer<typeof hojaEsquemaSchema>

export const seccionEsquemaSchema = z.object({
  producto_id: z.number().int().positive(),
  hojas: z.array(hojaEsquemaSchema),
})
export type SeccionEsquema = z.infer<typeof seccionEsquemaSchema>

export const cintaEsquemaSchema = z.object({
  total_m: z.number().nonnegative(),
  por_color: z.record(z.string(), z.number().nonnegative()),
})
export type CintaEsquema = z.infer<typeof cintaEsquemaSchema>

/** Convierte el cálculo de cinta del optimizador al formato persistido. */
export function cintaAEsquema(metros: MetrosCinta): CintaEsquema {
  return { total_m: metros.total, por_color: metros.porColor }
}

/** Convierte el formato persistido al cálculo de cinta que usa el optimizador. */
export function cintaDesdeEsquema(cinta: CintaEsquema): MetrosCinta {
  return { total: cinta.total_m, porColor: cinta.por_color }
}

export const esquemaCorteSchema = z.object({
  version: z.number().int().positive(),
  kerf_mm: z.number().nonnegative(),
  refilado_mm: z.number().nonnegative(),
  modo: z.enum(MODO_CORTE),
  secciones: z.array(seccionEsquemaSchema),
  cinta: cintaEsquemaSchema,
})
export type EsquemaCorte = z.infer<typeof esquemaCorteSchema>

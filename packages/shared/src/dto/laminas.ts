import { z } from 'zod'

import { idSchema } from './common'

/** Datos propios de las láminas, en relación 1 a 1 con un producto LAMINA. */
const laminaCamposSchema = z.object({
  tipo: z.string().trim().min(1, 'el tipo es requerido'),
  color: z.string().trim().nullish(),
  espesor_mm: z.number().int().positive(),
  /** Medidas de la hoja entera, en milímetros. */
  largo_mm: z.number().int().positive(),
  ancho_mm: z.number().int().positive(),
  tiene_veta: z.boolean(),
})

export const laminaInputSchema = laminaCamposSchema.extend({
  producto_id: idSchema,
  tiene_veta: z.boolean().default(false),
})

export const laminaUpdateSchema = laminaCamposSchema.partial()

export const laminaSchema = z.object({
  producto_id: idSchema,
  tipo: z.string(),
  color: z.string().nullable(),
  espesor_mm: z.number().int().positive(),
  largo_mm: z.number().int().positive(),
  ancho_mm: z.number().int().positive(),
  tiene_veta: z.boolean(),
})

export type LaminaInput = z.infer<typeof laminaInputSchema>
export type LaminaUpdate = z.infer<typeof laminaUpdateSchema>
export type Lamina = z.infer<typeof laminaSchema>

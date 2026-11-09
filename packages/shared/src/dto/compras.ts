import { z } from 'zod'

import { dineroSchema } from '../dinero'
import { fechaSchema, idSchema } from './common'

/**
 * Compra de reabastecimiento (por paquete o por unidades sueltas). `cantidad` son
 * las hojas o unidades que llegaron; `costo_unitario = costo_total / cantidad` lo
 * calcula la base como columna generada (sección 5.3).
 */
export const compraInputSchema = z.object({
  producto_id: idSchema,
  fecha: fechaSchema.optional(),
  cantidad: z.number().int().positive(),
  costo_total: dineroSchema,
})

export const compraSchema = z.object({
  id: idSchema,
  sucursal_id: idSchema,
  producto_id: idSchema,
  fecha: fechaSchema,
  cantidad: z.number().int().positive(),
  costo_total: dineroSchema,
  /** Solo lectura (columna generada). */
  costo_unitario: dineroSchema,
})

export type CompraInput = z.infer<typeof compraInputSchema>
export type Compra = z.infer<typeof compraSchema>

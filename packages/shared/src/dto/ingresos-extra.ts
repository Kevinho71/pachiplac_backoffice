import { z } from 'zod'

import { dineroSchema } from '../dinero'
import { fechaSchema, idSchema } from './common'

/**
 * Ingreso extra (retazos vendidos), fuera del inventario (sección 5.8). Si el retazo
 * se vende ya cortado y con cinta, el precio de la cinta se anota aparte.
 */
export const ingresoExtraInputSchema = z.object({
  fecha: fechaSchema.optional(),
  material: z.string().trim().min(1, 'el material es requerido'),
  precio_pieza: dineroSchema.default('0.00'),
  precio_cinta: dineroSchema.default('0.00'),
  monto_total: dineroSchema,
})

export const ingresoExtraSchema = z.object({
  id: idSchema,
  sucursal_id: idSchema,
  fecha: fechaSchema,
  material: z.string(),
  precio_pieza: dineroSchema,
  precio_cinta: dineroSchema,
  monto_total: dineroSchema,
})

export type IngresoExtraInput = z.infer<typeof ingresoExtraInputSchema>
export type IngresoExtra = z.infer<typeof ingresoExtraSchema>

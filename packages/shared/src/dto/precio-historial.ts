import { z } from 'zod'

import { dineroSchema } from '../dinero'
import { fechaHoraSchema, idSchema } from './common'

/**
 * Historial de precios por unidad de venta. Para una lámina, el precio guardado es
 * el de **una media** (`precio de la hoja / 2`); lo calcula la app. El precio vigente
 * es la fila con `vigente_desde` más reciente que no sea futura (sección 5.2).
 */
export const precioHistorialInputSchema = z.object({
  producto_id: idSchema,
  precio: dineroSchema,
  vigente_desde: fechaHoraSchema.optional(),
})

export const precioHistorialSchema = z.object({
  id: idSchema,
  producto_id: idSchema,
  precio: dineroSchema,
  vigente_desde: fechaHoraSchema,
})

export type PrecioHistorialInput = z.infer<typeof precioHistorialInputSchema>
export type PrecioHistorial = z.infer<typeof precioHistorialSchema>

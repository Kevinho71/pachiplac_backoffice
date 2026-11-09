import { z } from 'zod'

import { idSchema } from './common'

/**
 * Stock calculado (`compras − ventas`), en unidad de venta (láminas: medias).
 * Es una vista de solo lectura, no un recurso editable (sección 5.3).
 */
export const stockItemSchema = z.object({
  sucursal_id: idSchema,
  producto_id: idSchema,
  stock: z.number(),
})

export type StockItem = z.infer<typeof stockItemSchema>

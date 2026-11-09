import { z } from 'zod'

import { cantidadSchema, dineroSchema } from '../dinero'
import { idSchema } from './common'

/**
 * Detalle de una venta. `cantidad` en medias (láminas), metros (cinta) o unidades
 * (herrajes). `precio_unitario` es copia del precio vigente al vender (regla R8);
 * `subtotal = cantidad × precio_unitario` es una columna generada (solo lectura).
 */
export const ventaItemInputSchema = z.object({
  producto_id: idSchema,
  cantidad: cantidadSchema,
  precio_unitario: dineroSchema,
})

export const ventaItemSchema = z.object({
  id: idSchema,
  orden_venta: idSchema,
  producto_id: idSchema,
  cantidad: cantidadSchema,
  precio_unitario: dineroSchema,
  /** Solo lectura (columna generada). */
  subtotal: dineroSchema,
})

export type VentaItemInput = z.infer<typeof ventaItemInputSchema>
export type VentaItem = z.infer<typeof ventaItemSchema>

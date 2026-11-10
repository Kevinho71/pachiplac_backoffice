import { z } from 'zod'

import { fechaSchema } from '@pachiplac/shared'

/** Filtros del listado de compras de la sucursal activa. */
export const listarComprasQuerySchema = z.object({
  productoId: z.coerce.number().int().positive().optional(),
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
})

export type ListarComprasQuery = z.infer<typeof listarComprasQuerySchema>

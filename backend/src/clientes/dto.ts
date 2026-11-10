import { z } from 'zod'

/** Filtros del listado de clientes de la sucursal activa. */
export const listarClientesQuerySchema = z.object({
  q: z.string().trim().optional(),
})

export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>

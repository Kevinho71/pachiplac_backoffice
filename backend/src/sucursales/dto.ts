import { z } from 'zod'
import { idSchema } from '@pachiplac/shared'

/** Selección de la sucursal activa en la sesión. */
export const seleccionarSucursalSchema = z.object({
  sucursalId: idSchema,
})

export type SeleccionarSucursal = z.infer<typeof seleccionarSucursalSchema>

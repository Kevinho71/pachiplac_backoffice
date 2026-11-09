import { z } from 'zod'

import { idSchema } from './common'

/**
 * Sucursal (multitenencia por fila). El `sucursal_id` de la sucursal activa se toma
 * siempre de la sesión, nunca del cuerpo de la petición (sección 13).
 */

const sucursalCamposSchema = z.object({
  nombre: z.string().trim().min(1, 'el nombre es requerido'),
  ciudad: z.string().trim().min(1, 'la ciudad es requerida'),
  direccion: z.string().trim().nullish(),
  telefono: z.string().trim().nullish(),
  activa: z.boolean(),
})

export const sucursalInputSchema = sucursalCamposSchema.extend({
  activa: z.boolean().default(true),
})

export const sucursalUpdateSchema = sucursalCamposSchema.partial()

export const sucursalSchema = z.object({
  id: idSchema,
  nombre: z.string(),
  ciudad: z.string(),
  direccion: z.string().nullable(),
  telefono: z.string().nullable(),
  activa: z.boolean(),
})

export type SucursalInput = z.infer<typeof sucursalInputSchema>
export type SucursalUpdate = z.infer<typeof sucursalUpdateSchema>
export type Sucursal = z.infer<typeof sucursalSchema>

import { z } from 'zod'

import { idSchema } from './common'

const clienteCamposSchema = z.object({
  nombre: z.string().trim().min(1, 'el nombre es requerido'),
  telefono: z.string().trim().nullish(),
})

export const clienteInputSchema = clienteCamposSchema

export const clienteUpdateSchema = clienteCamposSchema.partial()

export const clienteSchema = z.object({
  id: idSchema,
  sucursal_id: idSchema,
  nombre: z.string(),
  telefono: z.string().nullable(),
})

export type ClienteInput = z.infer<typeof clienteInputSchema>
export type ClienteUpdate = z.infer<typeof clienteUpdateSchema>
export type Cliente = z.infer<typeof clienteSchema>

import { z } from 'zod'

import { dineroSchema, fechaSchema } from '@pachiplac/shared'

/** Filtros del listado de ingresos extra de la sucursal activa. */
export const listarIngresosExtraQuerySchema = z.object({
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
  q: z.string().trim().optional(),
})

/**
 * Edición parcial. Se define sin los `.default` del contrato de alta para que
 * un campo omitido no se pise con `0.00`.
 */
export const actualizarIngresoExtraSchema = z
  .object({
    fecha: fechaSchema,
    material: z.string().trim().min(1, 'el material es requerido'),
    precio_pieza: dineroSchema,
    precio_cinta: dineroSchema,
    monto_total: dineroSchema,
  })
  .partial()

export type ListarIngresosExtraQuery = z.infer<typeof listarIngresosExtraQuerySchema>
export type ActualizarIngresoExtraInput = z.infer<typeof actualizarIngresoExtraSchema>

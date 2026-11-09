import { z } from 'zod'

import { dineroSchema, esMenorOIgual } from '../dinero'
import { esquemaCorteSchema } from '../esquema'
import { fechaHoraSchema, idSchema } from './common'

/**
 * Venta. Reglas aplicadas (secciones 5.4–5.6):
 * - `saldo <= monto_total` (lo pagado es `monto_total − saldo`).
 * - `nro_factura` solo si `es_factura`.
 * El `sucursal_id` se toma de la sesión y el `numero` (secuencia por sucursal)
 * lo asigna el backend en la transacción (sección 7), por eso `numero` es opcional
 * en la entrada: si se envía, se ignora en favor del siguiente número.
 */
export const ventaInputSchema = z
  .object({
    numero: z.number().int().positive().optional(),
    cliente_id: idSchema.nullish(),
    fecha: fechaHoraSchema.optional(),
    monto_total: dineroSchema,
    saldo: dineroSchema,
    metodo_pago: z.string().trim().min(1, 'el método de pago es requerido'),
    es_factura: z.boolean().default(false),
    nro_factura: z.string().trim().nullish(),
    entregado: z.boolean().default(false),
    /** JSON del esquema de cortes; `null`/ausente si no hubo cortes. */
    esquema: esquemaCorteSchema.nullish(),
  })
  .superRefine((venta, ctx) => {
    if (!esMenorOIgual(venta.saldo, venta.monto_total)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'el saldo no puede superar el monto total',
        path: ['saldo'],
      })
    }
    if (venta.nro_factura && !venta.es_factura) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'solo las ventas con factura llevan número de factura',
        path: ['nro_factura'],
      })
    }
  })

/** Registro de un abono: resta del saldo actual (sección 5.5). */
export const ventaSaldoSchema = z.object({
  saldo: dineroSchema,
})

/** Marcar la venta como entregada. */
export const ventaEntregadoSchema = z.object({
  entregado: z.boolean(),
})

/** Reemplazar el esquema de cortes (recalcula ítems y total). */
export const ventaEsquemaSchema = z.object({
  esquema: esquemaCorteSchema.nullable(),
})

export const ventaSchema = z.object({
  orden_venta: idSchema,
  sucursal_id: idSchema,
  numero: z.number().int().positive(),
  cliente_id: idSchema.nullable(),
  fecha: fechaHoraSchema,
  monto_total: dineroSchema,
  saldo: dineroSchema,
  metodo_pago: z.string(),
  es_factura: z.boolean(),
  nro_factura: z.string().nullable(),
  entregado: z.boolean(),
  esquema: esquemaCorteSchema.nullable(),
})

export type VentaInput = z.infer<typeof ventaInputSchema>
export type VentaSaldoInput = z.infer<typeof ventaSaldoSchema>
export type VentaEntregadoInput = z.infer<typeof ventaEntregadoSchema>
export type VentaEsquemaInput = z.infer<typeof ventaEsquemaSchema>
export type Venta = z.infer<typeof ventaSchema>

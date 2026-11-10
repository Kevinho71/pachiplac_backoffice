import { z } from 'zod'

import {
  cantidadSchema,
  dineroSchema,
  esMenorOIgual,
  esquemaCorteSchema,
  fechaHoraSchema,
  fechaSchema,
  idSchema,
} from '@pachiplac/shared'

/**
 * Alta de venta. Es una extensión local del contrato `ventaInputSchema`
 * (packages/shared queda congelado): agrega los ítems y deja el `monto_total`
 * opcional para que el backend lo calcule desde los ítems y el esquema.
 */
const ventaBaseSchema = z.object({
  cliente_id: idSchema.nullish(),
  fecha: fechaHoraSchema.optional(),
  monto_total: dineroSchema.optional(),
  saldo: dineroSchema.optional(),
  metodo_pago: z.string().trim().min(1, 'el método de pago es requerido'),
  es_factura: z.boolean().default(false),
  nro_factura: z.string().trim().nullish(),
  entregado: z.boolean().default(false),
  esquema: esquemaCorteSchema.nullish(),
})

export const crearVentaSchema = ventaBaseSchema
  .extend({
    items: z
      .array(
        z.object({
          producto_id: idSchema,
          cantidad: cantidadSchema,
          precio_unitario: dineroSchema.optional(),
        }),
      )
      .min(1, 'la venta necesita al menos un ítem'),
  })
  .superRefine((venta, ctx) => {
    if (venta.saldo !== undefined && venta.monto_total !== undefined) {
      if (!esMenorOIgual(venta.saldo, venta.monto_total)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'el saldo no puede superar el monto total',
          path: ['saldo'],
        })
      }
    }
    if (venta.nro_factura && !venta.es_factura) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'solo las ventas con factura llevan número de factura',
        path: ['nro_factura'],
      })
    }
  })

/**
 * Registro de un abono. Acepta `abono` (monto a restar del saldo) o `saldo`
 * (saldo resultante). El contrato compartido define `saldo`; `abono` es el
 * atajo que usa la pantalla de ventas para registrar un pago.
 */
export const actualizarSaldoSchema = z
  .object({
    abono: dineroSchema.optional(),
    saldo: dineroSchema.optional(),
  })
  .refine((valor) => (valor.abono === undefined) !== (valor.saldo === undefined), {
    message: 'enviá exactamente uno de abono o saldo',
  })

export const actualizarEntregadoSchema = z.object({
  entregado: z.boolean(),
})

export const actualizarEsquemaSchema = z.object({
  esquema: esquemaCorteSchema.nullable(),
})

export const listarVentasQuerySchema = z.object({
  desde: fechaSchema.optional(),
  hasta: fechaSchema.optional(),
  esFactura: z.enum(['true', 'false']).optional(),
  pendientes: z.enum(['true', 'false']).optional(),
  entregado: z.enum(['true', 'false']).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
})

export const documentoQuerySchema = z.object({
  tipo: z.enum(['NOTA', 'PEDIDO']).default('NOTA'),
})

export type CrearVentaInput = z.infer<typeof crearVentaSchema>
export type ActualizarSaldoInput = z.infer<typeof actualizarSaldoSchema>
export type ActualizarEntregadoInput = z.infer<typeof actualizarEntregadoSchema>
export type ActualizarEsquemaInput = z.infer<typeof actualizarEsquemaSchema>
export type ListarVentasQuery = z.infer<typeof listarVentasQuerySchema>
export type DocumentoQuery = z.infer<typeof documentoQuerySchema>

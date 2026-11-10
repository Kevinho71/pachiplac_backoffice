import { z } from 'zod'

import {
  CATEGORIA_PRODUCTO,
  UNIDAD_POR_CATEGORIA,
  UNIDAD_VENTA,
  dineroSchema,
  fechaHoraSchema,
} from '@pachiplac/shared'

const categoriaSchema = z.enum(CATEGORIA_PRODUCTO)
const unidadVentaSchema = z.enum(UNIDAD_VENTA)

const productoBaseSchema = z.object({
  categoria: categoriaSchema,
  nombre: z.string().trim().min(1, 'el nombre es requerido'),
  unidad_venta: unidadVentaSchema,
  unidades_por_compra: z.number().int().positive().optional(),
  controla_stock: z.boolean().optional(),
  activo: z.boolean().optional(),
})

const laminaCamposSchema = z.object({
  tipo: z.string().trim().min(1, 'el tipo es requerido'),
  color: z.string().trim().nullish(),
  espesor_mm: z.number().int().positive('el espesor debe ser positivo'),
  largo_mm: z.number().int().positive('el largo debe ser positivo'),
  ancho_mm: z.number().int().positive('el ancho debe ser positivo'),
  tiene_veta: z.boolean().optional(),
})

/** Alta de producto; si es LAMINA exige sus datos (1 a 1) y admite precio inicial. */
export const crearProductoSchema = productoBaseSchema
  .extend({
    lamina: laminaCamposSchema.optional(),
    precio_inicial: dineroSchema.optional(),
  })
  .superRefine((producto, ctx) => {
    const esperada = UNIDAD_POR_CATEGORIA[producto.categoria]
    if (producto.unidad_venta !== esperada) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `unidad_venta de ${producto.categoria} debe ser ${esperada}`,
        path: ['unidad_venta'],
      })
    }
    if (producto.categoria === 'LAMINA' && !producto.lamina) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'una lámina requiere tipo, espesor y medidas',
        path: ['lamina'],
      })
    }
    if (producto.categoria !== 'LAMINA' && producto.lamina) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'solo las láminas llevan datos de lámina',
        path: ['lamina'],
      })
    }
  })

/** Edición parcial; la categoría no se cambia (para no romper la lámina 1 a 1). */
export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1, 'el nombre es requerido').optional(),
  unidad_venta: unidadVentaSchema.optional(),
  unidades_por_compra: z.number().int().positive().optional(),
  controla_stock: z.boolean().optional(),
  activo: z.boolean().optional(),
  lamina: laminaCamposSchema.partial().optional(),
})

export const listarProductosQuerySchema = z.object({
  categoria: categoriaSchema.optional(),
  activo: z.enum(['true', 'false']).optional(),
  q: z.string().trim().optional(),
})

export const nuevoPrecioSchema = z.object({
  precio: dineroSchema,
  vigente_desde: fechaHoraSchema.optional(),
})

export type CrearProductoInput = z.infer<typeof crearProductoSchema>
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>
export type ListarProductosQuery = z.infer<typeof listarProductosQuerySchema>
export type NuevoPrecioInput = z.infer<typeof nuevoPrecioSchema>

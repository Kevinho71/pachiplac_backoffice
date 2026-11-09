import { z } from 'zod'

import { idSchema } from './common'

/** Categorías del catálogo unificado (sección 5.1). */
export const CATEGORIA_PRODUCTO = ['LAMINA', 'CINTA', 'HERRAJE'] as const
export type CategoriaProducto = (typeof CATEGORIA_PRODUCTO)[number]

/** Unidades de venta por categoría (sección 5.1). */
export const UNIDAD_VENTA = ['MEDIA', 'METRO', 'UNIDAD'] as const
export type UnidadVenta = (typeof UNIDAD_VENTA)[number]

/** Coherencia categoría ↔ unidad de venta (tabla 5.1). */
export const UNIDAD_POR_CATEGORIA: Record<CategoriaProducto, UnidadVenta> = {
  LAMINA: 'MEDIA',
  CINTA: 'METRO',
  HERRAJE: 'UNIDAD',
}

const categoriaSchema = z.enum(CATEGORIA_PRODUCTO)
const unidadVentaSchema = z.enum(UNIDAD_VENTA)

const productoCamposSchema = z.object({
  categoria: categoriaSchema,
  nombre: z.string().trim().min(1, 'el nombre es requerido'),
  unidad_venta: unidadVentaSchema,
  /** Cuántas unidades de venta trae una unidad comprada: 2 para láminas (1 hoja = 2 medias). */
  unidades_por_compra: z.number().int().positive(),
  controla_stock: z.boolean(),
  activo: z.boolean(),
})

export const productoInputSchema = productoCamposSchema
  .extend({
    unidades_por_compra: z.number().int().positive().default(1),
    controla_stock: z.boolean().default(true),
    activo: z.boolean().default(true),
  })
  .superRefine((producto, ctx) => {
    const esperada = UNIDAD_POR_CATEGORIA[producto.categoria]
    if (producto.unidad_venta !== esperada) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `unidad_venta de un producto ${producto.categoria} debe ser ${esperada}`,
        path: ['unidad_venta'],
      })
    }
  })

export const productoUpdateSchema = productoCamposSchema.partial()

export const productoSchema = z.object({
  id: idSchema,
  sucursal_id: idSchema,
  categoria: categoriaSchema,
  nombre: z.string(),
  unidad_venta: unidadVentaSchema,
  unidades_por_compra: z.number().int().positive(),
  controla_stock: z.boolean(),
  activo: z.boolean(),
})

export type ProductoInput = z.infer<typeof productoInputSchema>
export type ProductoUpdate = z.infer<typeof productoUpdateSchema>
export type Producto = z.infer<typeof productoSchema>

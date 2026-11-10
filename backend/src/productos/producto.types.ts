import type { CategoriaProducto, Lamina, UnidadVenta } from '@pachiplac/shared'

/** Producto con los datos de lámina, su precio vigente y el stock de la sucursal. */
export interface ProductoDetalle {
  id: number
  sucursal_id: number
  categoria: CategoriaProducto
  nombre: string
  unidad_venta: UnidadVenta
  unidades_por_compra: number
  controla_stock: boolean
  activo: boolean
  lamina: Lamina | null
  /** Precio por unidad de venta (media, metro o unidad). `null` si nunca se cargó. */
  precio_vigente: string | null
  /** Stock en unidad de venta (láminas: medias). `null` si el producto no controla stock. */
  stock: number | null
}

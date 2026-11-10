import type { CategoriaProducto, UnidadVenta } from '@pachiplac/shared'

/** Fila de la vista `stock`, con los datos del producto para mostrarla. */
export interface StockDetalle {
  producto_id: number
  nombre: string
  categoria: CategoriaProducto
  unidad_venta: UnidadVenta
  unidades_por_compra: number
  /** Stock en unidad de venta (láminas: medias). */
  stock: number
}

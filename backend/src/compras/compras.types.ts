import type { CategoriaProducto, UnidadVenta } from '@pachiplac/shared'

/** Compra con su costo unitario (calculado) y el producto al que pertenece. */
export interface CompraDetalle {
  id: number
  sucursal_id: number
  producto_id: number
  fecha: string
  cantidad: number
  costo_total: string
  costo_unitario: string
  producto: {
    id: number
    nombre: string
    categoria: CategoriaProducto
    unidad_venta: UnidadVenta
  }
}

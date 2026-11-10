import type { CategoriaProducto, UnidadVenta } from '@pachiplac/shared'

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

export interface StockDetalle {
  producto_id: number
  nombre: string
  categoria: CategoriaProducto
  unidad_venta: UnidadVenta
  unidades_por_compra: number
  stock: number
}

export interface CrearCompraPayload {
  producto_id: number
  cantidad: number
  costo_total: string
  fecha?: string
}

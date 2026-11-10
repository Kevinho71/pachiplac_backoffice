import type { CategoriaProducto, UnidadVenta } from '@pachiplac/shared'

/** Lámina con los datos mínimos de su producto, filtrada por sucursal. */
export interface LaminaDetalle {
  producto_id: number
  tipo: string
  color: string | null
  espesor_mm: number
  largo_mm: number
  ancho_mm: number
  tiene_veta: boolean
  producto: {
    id: number
    nombre: string
    categoria: CategoriaProducto
    unidad_venta: UnidadVenta
    activo: boolean
  }
}

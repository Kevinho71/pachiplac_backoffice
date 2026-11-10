import type { CategoriaProducto, Lamina, UnidadVenta } from '@pachiplac/shared'

/** Producto tal como lo devuelve `GET /productos` (con lámina, precio y stock). */
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
  precio_vigente: string | null
  stock: number | null
}

export interface LaminaPayload {
  tipo: string
  color?: string | null
  espesor_mm: number
  largo_mm: number
  ancho_mm: number
  tiene_veta?: boolean
}

export interface CrearProductoPayload {
  categoria: CategoriaProducto
  nombre: string
  unidad_venta: UnidadVenta
  unidades_por_compra?: number
  controla_stock?: boolean
  activo?: boolean
  lamina?: LaminaPayload
  /** Precio por unidad de venta (media para láminas). */
  precio_inicial?: string
}

export interface ActualizarProductoPayload {
  nombre?: string
  unidad_venta?: UnidadVenta
  unidades_por_compra?: number
  controla_stock?: boolean
  activo?: boolean
  lamina?: Partial<LaminaPayload>
}

export interface FiltrosProductos {
  categoria?: CategoriaProducto
  activo?: boolean
  q?: string
}

export const CATEGORIA_LABEL: Record<CategoriaProducto, string> = {
  LAMINA: 'Lámina',
  CINTA: 'Cinta',
  HERRAJE: 'Herraje',
}

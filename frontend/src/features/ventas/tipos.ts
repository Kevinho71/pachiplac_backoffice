import type {
  CategoriaProducto,
  Cliente,
  EsquemaCorte,
  UnidadVenta,
} from '@pachiplac/shared'

export interface VentaItemDetalle {
  id: number
  producto_id: number
  producto_nombre: string
  categoria: CategoriaProducto
  unidad_venta: UnidadVenta
  cantidad: string
  precio_unitario: string
  subtotal: string
}

export interface ClienteVenta {
  id: number
  nombre: string
  telefono: string | null
}

export interface VentaResumen {
  orden_venta: number
  sucursal_id: number
  numero: number
  cliente_id: number | null
  cliente: ClienteVenta | null
  fecha: string
  monto_total: string
  saldo: string
  pagado: string
  cancelada: boolean
  metodo_pago: string
  es_factura: boolean
  nro_factura: string | null
  entregado: boolean
  cantidad_items: number
  cinta_colocada_m: number
  tiene_esquema: boolean
  hojas_corte: number
  corte_autorizado: boolean
}

export interface VentaDetalle extends VentaResumen {
  esquema: EsquemaCorte | null
  items: VentaItemDetalle[]
}

export interface DocumentoImpresion {
  tipo: 'NOTA' | 'PEDIDO'
  autorizado: boolean
  aviso: string | null
  venta: VentaDetalle
  sucursal: {
    id: number
    nombre: string
    ciudad: string
    direccion: string | null
    telefono: string | null
  }
}

export interface FiltrosVentas {
  desde?: string
  hasta?: string
  esFactura?: boolean
  pendientes?: boolean
  entregado?: boolean
  clienteId?: number
}

/** Ítem en edición: copia del producto y el precio vigente al agregarlo. */
export interface ItemVentaDraft {
  id: string
  producto_id: number
  nombre: string
  categoria: CategoriaProducto
  unidad_venta: UnidadVenta
  cantidad: string
  precio_unitario: string
  stock: number | null
}

/** Una sección del esquema: un material (producto) con sus hojas de corte. */
export interface SeccionEsquemaDraft {
  id: string
  producto_id: number
  material: string
  largo_mm: number
  ancho_mm: number
  total_medias: number
  esquema: EsquemaCorte
}

/** Contexto que consume la pantalla del editor cuando se viene de una venta. */
export interface EditorVentaContexto {
  key: string
  seccionId: string | null
  producto_id: number
  material: string
  largo_mm: number
  ancho_mm: number
  /** Esquema de una sola sección, presente al reeditar. */
  esquema: EsquemaCorte | null
}

export interface CrearVentaPayload {
  cliente_id: number | null
  fecha?: string
  monto_total?: string
  saldo: string
  metodo_pago: string
  es_factura: boolean
  nro_factura: string | null
  entregado: boolean
  esquema: EsquemaCorte | null
  items: Array<{ producto_id: number; cantidad: string; precio_unitario?: string }>
}

export type ClienteListado = Cliente

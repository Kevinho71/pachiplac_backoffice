import type {
  CategoriaProducto,
  EsquemaCorte,
  UnidadVenta,
} from '@pachiplac/shared'

/** Ítem de venta con los datos del producto (subtotal calculado en el servicio). */
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

/** Cliente embebido en la venta (opcional: venta de mostrador). */
export interface ClienteVenta {
  id: number
  nombre: string
  telefono: string | null
}

/** Datos de la sucursal que encabezan la nota y el pedido de corte. */
export interface SucursalImpresion {
  id: number
  nombre: string
  ciudad: string
  direccion: string | null
  telefono: string | null
}

/** Fila del listado de ventas de la sucursal activa. */
export interface VentaResumen {
  orden_venta: number
  sucursal_id: number
  numero: number
  cliente_id: number | null
  cliente: ClienteVenta | null
  fecha: string
  monto_total: string
  saldo: string
  /** `monto_total − saldo` (regla R9). */
  pagado: string
  cancelada: boolean
  metodo_pago: string
  es_factura: boolean
  nro_factura: string | null
  entregado: boolean
  cantidad_items: number
  /** Metros de cinta colocada, derivados del esquema. */
  cinta_colocada_m: number
  /** Si la venta tiene un esquema de cortes guardado. */
  tiene_esquema: boolean
  /** Total de hojas de corte de todas las secciones del esquema. */
  hojas_corte: number
  /** `saldo <= monto_total × 0,5` (regla R10; avisa, no bloquea). */
  corte_autorizado: boolean
}

/** Venta completa, con ítems y el JSONB del esquema de cortes. */
export interface VentaDetalle extends VentaResumen {
  esquema: EsquemaCorte | null
  items: VentaItemDetalle[]
}

/** Datos listos para imprimir la nota pequeña o el pedido de corte. */
export interface DocumentoImpresion {
  tipo: 'NOTA' | 'PEDIDO'
  /** Regla del 50%: si es `false` el front avisa, pero permite imprimir. */
  autorizado: boolean
  aviso: string | null
  venta: VentaDetalle
  sucursal: SucursalImpresion
}

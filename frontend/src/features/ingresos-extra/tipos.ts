import type { IngresoExtra } from '@pachiplac/shared'

export type { IngresoExtra }

export interface FiltrosIngresosExtra {
  desde?: string
  hasta?: string
  q?: string
}

export interface CrearIngresoExtraPayload {
  fecha?: string
  material: string
  precio_pieza: string
  precio_cinta: string
  monto_total: string
}

export type ActualizarIngresoExtraPayload = Partial<CrearIngresoExtraPayload>

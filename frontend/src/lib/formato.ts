import type { UnidadVenta } from '@pachiplac/shared'

export function sufijoUnidad(unidad: UnidadVenta): string {
  switch (unidad) {
    case 'MEDIA':
      return 'media'
    case 'METRO':
      return 'm'
    case 'UNIDAD':
      return 'u.'
  }
}

export function formatearPrecio(precio: string | null, unidad: UnidadVenta): string {
  if (precio === null) return 'Sin precio'
  return `Bs ${precio} / ${sufijoUnidad(unidad)}`
}

/** Monto en bolivianos ya formateado por el backend (2 decimales). */
export function formatearBs(monto: string): string {
  return `Bs ${monto}`
}

/** Stock en unidad de venta; para láminas lo muestra como hojas + media. */
export function formatearStock(stock: number | null, unidad: UnidadVenta): string {
  if (stock === null) return '—'
  if (unidad === 'MEDIA') {
    if (stock < 0) return `${Math.abs(stock)} medias en faltante`
    const medias = Math.round(stock)
    const hojas = Math.floor(medias / 2)
    const resto = medias % 2
    if (hojas === 0) return `${medias} media${medias === 1 ? '' : 's'}`
    return `${hojas} hoja${hojas === 1 ? '' : 's'}${resto ? ' + 1 media' : ''}`
  }
  if (unidad === 'METRO') {
    return `${stock.toFixed(2)} m`
  }
  return `${stock} u.`
}

export function formatearFechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  if (!anio || !mes || !dia) return iso
  return `${dia}/${mes}/${anio}`
}

export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}

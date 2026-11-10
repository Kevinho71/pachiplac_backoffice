import type { TipoHoja } from '@pachiplac/optimizer'

export const TIPO_HOJA_LABEL: Record<TipoHoja, string> = {
  ENTERA: 'Hoja entera',
  MEDIA_LARGA: 'Media a lo largo',
  MEDIA_ANCHA: 'Media a lo ancho',
}

export function formatearDimensiones(ancho: number, alto: number): string {
  return `${Math.round(ancho)} × ${Math.round(alto)} mm`
}

export function formatearMetros(metros: number): string {
  return `${metros.toFixed(2)} m`
}

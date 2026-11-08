import type { Dimensiones } from './geometria'
import type { HojaDisponible, TipoHoja } from './types'

export interface TipoResuelto extends HojaDisponible {
  /** Superficie útil luego de descontar el refilado de cada lado. */
  usable: Dimensiones
}

const ORDEN_TIPOS: Record<TipoHoja, number> = {
  ENTERA: 0,
  MEDIA_LARGA: 1,
  MEDIA_ANCHA: 2,
}

export function resolverTipo(hoja: HojaDisponible, refilado: number): TipoResuelto {
  if (
    !Number.isFinite(hoja.largo) ||
    !Number.isFinite(hoja.ancho) ||
    hoja.largo <= 0 ||
    hoja.ancho <= 0
  ) {
    throw new RangeError(`Hoja ${hoja.tipo}: medidas inválidas (${hoja.largo} × ${hoja.ancho})`)
  }
  if (!(hoja.costoMedias > 0)) {
    throw new RangeError(`Hoja ${hoja.tipo}: costoMedias inválido (${hoja.costoMedias})`)
  }
  const usable = { w: hoja.largo - 2 * refilado, h: hoja.ancho - 2 * refilado }
  if (usable.w <= 0 || usable.h <= 0) {
    throw new RangeError(
      `Hoja ${hoja.tipo}: el refilado (${refilado} mm por lado) no deja superficie útil`,
    )
  }
  return { ...hoja, usable }
}

/**
 * Normaliza la lista de hojas disponibles. Si el llamador solo pasa la hoja
 * entera, se derivan las dos medias hojas (a lo largo y a lo ancho) con costo 1,
 * que es como las ofrece el negocio (especificación 6.4).
 */
export function resolverTipos(hojas: readonly HojaDisponible[], refilado: number): TipoResuelto[] {
  if (hojas.length === 0) throw new Error('Debe haber al menos un tipo de hoja disponible')

  const resueltos: TipoResuelto[] = []
  for (const hoja of hojas) resueltos.push(resolverTipo(hoja, refilado))

  const hayMedia = resueltos.some((h) => h.tipo !== 'ENTERA')
  if (!hayMedia) {
    const medias: TipoResuelto[] = []
    for (const entera of resueltos) {
      if (entera.tipo !== 'ENTERA') continue
      medias.push(
        resolverTipo(
          {
            tipo: 'MEDIA_LARGA',
            largo: Math.floor(entera.largo / 2),
            ancho: entera.ancho,
            costoMedias: 1,
          },
          refilado,
        ),
        resolverTipo(
          {
            tipo: 'MEDIA_ANCHA',
            largo: entera.largo,
            ancho: Math.floor(entera.ancho / 2),
            costoMedias: 1,
          },
          refilado,
        ),
      )
    }
    resueltos.push(...medias)
  }

  // Deduplicar por tipo + medidas (el llamador puede repetir la misma hoja).
  const vistos = new Map<string, TipoResuelto>()
  for (const tipo of resueltos) {
    const clave = `${tipo.tipo}|${tipo.largo}|${tipo.ancho}`
    if (!vistos.has(clave)) vistos.set(clave, tipo)
  }

  return [...vistos.values()].sort(
    (a, b) =>
      ORDEN_TIPOS[a.tipo] - ORDEN_TIPOS[b.tipo] ||
      a.costoMedias - b.costoMedias ||
      a.usable.w * a.usable.h - b.usable.w * b.usable.h,
  )
}

export function cabeEn(tipo: TipoResuelto, w: number, h: number): boolean {
  return w <= tipo.usable.w && h <= tipo.usable.h
}

import {
  aDecimal,
  bordesAOptimizador,
  calcularMetrosCinta,
  comparar,
  dinero,
  redondear,
  restar,
  sumar,
  type Dinero,
  type EsquemaCorte,
  type MetrosCinta,
} from '@pachiplac/shared'

/** Normaliza un nombre para comparar sin acentos ni mayúsculas. */
function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * El catálogo modela la cinta como dos productos sembrados por sucursal:
 * "Cinta de canto colocada" y "Cinta de canto suelta". No hay una columna que
 * los distinga, así que la convención es el nombre (sección 5.1).
 */
export function esCintaColocada(nombre: string): boolean {
  return normalizarNombre(nombre).includes('colocad')
}

/** Subtotal de un ítem: `cantidad × precio_unitario`, redondeado a 2 decimales. */
export function subtotalItem(cantidad: Dinero, precioUnitario: Dinero): Dinero {
  return dinero(aDecimal(cantidad).times(precioUnitario))
}

/** Suma exacta de los subtotales de una venta. */
export function totalDeItems(items: ReadonlyArray<{ cantidad: Dinero; precio_unitario: Dinero }>): Dinero {
  return sumar(...items.map((item) => subtotalItem(item.cantidad, item.precio_unitario)))
}

/**
 * Metros de cinta de todo el esquema, recalculados desde las piezas colocadas
 * con la función compartida (sección 5.9). No se confía en el valor persistido:
 * el backend recalcula al guardar (regla de coherencia de la sección 8).
 */
export function calcularCintaDeEsquema(esquema: EsquemaCorte | null | undefined): MetrosCinta {
  if (!esquema) return { total: 0, porColor: {} }

  const piezas = esquema.secciones.flatMap((seccion) =>
    seccion.hojas.flatMap((hoja) =>
      hoja.piezas.map((pieza) => ({
        largo: pieza.w,
        ancho: pieza.h,
        cantidad: 1,
        bordes: bordesAOptimizador(pieza.bordes),
      })),
    ),
  )

  return calcularMetrosCinta(piezas)
}

/** Devuelve el esquema con la cinta recalculada (instantánea coherente). */
export function esquemaCanonico(esquema: EsquemaCorte): EsquemaCorte {
  const cinta = calcularCintaDeEsquema(esquema)
  return {
    ...esquema,
    cinta: {
      total_m: redondear(cinta.total, 2),
      por_color: cinta.porColor,
    },
  }
}

/** Costo de una sección en medias hojas (entera = 2, media = 1). */
export function totalMediasDeSeccion(seccion: EsquemaCorte['secciones'][number]): number {
  return seccion.hojas.reduce((total, hoja) => total + (hoja.tipo === 'ENTERA' ? 2 : 1), 0)
}

/** Regla R10: el corte se autoriza si `saldo <= monto_total × 0,5`. */
export function autorizaCorte(montoTotal: Dinero, saldo: Dinero): boolean {
  const limite = aDecimal(montoTotal).times('0.5')
  return aDecimal(saldo).lte(limite)
}

/**
 * Saldo luego de un abono (`saldo − abono`), nunca negativo. Si el abono supera
 * el saldo se rechaza con `null` para que el servicio decida el error.
 */
export function saldoTrasAbono(saldo: Dinero, abono: Dinero): Dinero | null {
  if (comparar(abono, saldo) > 0) return null
  const resultado = restar(saldo, abono)
  return comparar(resultado, '0') < 0 ? '0.00' : resultado
}

/**
 * Ajuste manual de una venta (`monto_total` fijado por el dueño menos la suma
 * de ítems). Puede ser negativo (descuento) o positivo (recargo); se conserva
 * al recalcular el esquema.
 */
export function ajusteDeVenta(montoTotal: Dinero, items: ReadonlyArray<{ cantidad: Dinero; precio_unitario: Dinero }>): Dinero {
  return restar(montoTotal, totalDeItems(items))
}

/** Aplica el ajuste al nuevo total de ítems sin bajar de cero. */
export function montoConAjuste(totalItems: Dinero, ajuste: Dinero): Dinero {
  const resultado = dinero(aDecimal(totalItems).plus(ajuste))
  return comparar(resultado, '0') < 0 ? '0.00' : resultado
}

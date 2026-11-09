import Decimal from 'decimal.js'
import { z } from 'zod'

/**
 * Monto en bolivianos, representado como **string decimal con hasta 2 decimales**
 * (p. ej. `"14.60"`). Se usa string (no `number`) en la frontera JSON para evitar
 * errores de punto flotante; la aritmética se hace con `decimal.js` (ver sección 9.1).
 */
export type Dinero = string

const DECIMAL_RE = /^\d+(\.\d{1,2})?$/
const DECIMAL_MENSAJE = 'debe ser un decimal no negativo con hasta 2 decimales'

/** Monto `>= 0` con hasta 2 decimales (bolivianos). */
export const dineroSchema = z.string().trim().regex(DECIMAL_RE, DECIMAL_MENSAJE)

/** Cantidad `> 0` con hasta 2 decimales (medias, metros o unidades). */
export const cantidadSchema = dineroSchema.refine(
  (valor) => new Decimal(valor).gt(0),
  'debe ser mayor que 0',
)

/** Convierte un `Dinero` a `Decimal` para operar con exactitud. */
export function aDecimal(monto: Dinero): Decimal {
  return new Decimal(monto)
}

/** Normaliza cualquier valor numérico a `Dinero` (siempre 2 decimales). */
export function dinero(valor: Decimal.Value): Dinero {
  return new Decimal(valor).toFixed(2)
}

/** Suma exacta de montos: `sumar('0.10', '0.20') === '0.30'`. */
export function sumar(...montos: Dinero[]): Dinero {
  let total = new Decimal(0)
  for (const monto of montos) {
    total = total.plus(monto)
  }
  return total.toFixed(2)
}

/**
 * Resta exacta `a − b`. No valida que el resultado sea no negativo: el llamador
 * debe garantizar `a >= b` cuando el resultado se use como `Dinero`.
 */
export function restar(a: Dinero, b: Dinero): Dinero {
  return new Decimal(a).minus(b).toFixed(2)
}

/** Multiplica un monto por un factor y redondea a 2 decimales. */
export function multiplicar(monto: Dinero, factor: Decimal.Value): Dinero {
  return new Decimal(monto).times(factor).toFixed(2)
}

/** Compara dos montos: `-1` si `a < b`, `0` si iguales, `1` si `a > b`. */
export function comparar(a: Dinero, b: Dinero): number {
  return new Decimal(a).comparedTo(b)
}

/** Verdadero si `a <= b` (usado en la regla `saldo <= monto_total`). */
export function esMenorOIgual(a: Dinero, b: Dinero): boolean {
  return new Decimal(a).lte(b)
}

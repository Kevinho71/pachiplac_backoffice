import { z } from 'zod'

/** Identificador entero positivo (SERIAL de PostgreSQL). */
export const idSchema = z.number().int().positive()

/** Fecha `YYYY-MM-DD` (columnas DATE). */
export const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha en formato YYYY-MM-DD')

/** Timestamp con zona horaria en ISO 8601 (columnas TIMESTAMPTZ). */
export const fechaHoraSchema = z.string().datetime({ offset: true })

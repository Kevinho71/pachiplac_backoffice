import { describe, expect, it } from 'vitest'
import { crearProductoSchema, listarProductosQuerySchema, nuevoPrecioSchema } from './dto'

const lamina = {
  tipo: 'melamina',
  color: 'Blanco',
  espesor_mm: 18,
  largo_mm: 2750,
  ancho_mm: 1830,
  tiene_veta: false,
}

describe('crearProductoSchema', () => {
  it('acepta una lámina con sus datos y precio inicial', () => {
    const resultado = crearProductoSchema.safeParse({
      categoria: 'LAMINA',
      nombre: 'Melamina blanca 18 mm',
      unidad_venta: 'MEDIA',
      lamina,
      precio_inicial: '250.00',
    })
    expect(resultado.success).toBe(true)
  })

  it('exige los datos de lámina para la categoría LAMINA', () => {
    const resultado = crearProductoSchema.safeParse({
      categoria: 'LAMINA',
      nombre: 'Sin datos',
      unidad_venta: 'MEDIA',
    })
    expect(resultado.success).toBe(false)
  })

  it('rechaza una unidad de venta incoherente con la categoría', () => {
    const resultado = crearProductoSchema.safeParse({
      categoria: 'CINTA',
      nombre: 'Cinta',
      unidad_venta: 'MEDIA',
    })
    expect(resultado.success).toBe(false)
  })

  it('rechaza datos de lámina en una categoría que no es LAMINA', () => {
    const resultado = crearProductoSchema.safeParse({
      categoria: 'HERRAJE',
      nombre: 'Bisagra',
      unidad_venta: 'UNIDAD',
      lamina,
    })
    expect(resultado.success).toBe(false)
  })
})

describe('listarProductosQuerySchema', () => {
  it('convierte activo=true y acepta filtros', () => {
    const resultado = listarProductosQuerySchema.parse({
      categoria: 'LAMINA',
      activo: 'true',
      q: 'roble',
    })
    expect(resultado).toEqual({ categoria: 'LAMINA', activo: 'true', q: 'roble' })
  })

  it('rechaza un activo que no sea true/false', () => {
    expect(listarProductosQuerySchema.safeParse({ activo: '1' }).success).toBe(false)
  })
})

describe('nuevoPrecioSchema', () => {
  it('acepta un precio con dos decimales', () => {
    expect(nuevoPrecioSchema.safeParse({ precio: '125.50' }).success).toBe(true)
  })

  it('rechaza precios con más de dos decimales', () => {
    expect(nuevoPrecioSchema.safeParse({ precio: '125.555' }).success).toBe(false)
  })
})

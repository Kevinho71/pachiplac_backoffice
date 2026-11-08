import { describe, expect, it } from 'vitest'
import { calcularMetrosCinta, largoDeLado, rotarBordes } from './index'

describe('calcularMetrosCinta', () => {
  it('suma los cuatro lados de una pieza sin rotar', () => {
    const resultado = calcularMetrosCinta([
      {
        largo: 800,
        ancho: 400,
        cantidad: 1,
        bordes: { sup: 'Blanco', inf: 'Blanco', izq: 'Blanco', der: 'Blanco' },
      },
    ])
    // 800 + 800 + 400 + 400 = 2400 mm = 2.4 m
    expect(resultado.total).toBe(2.4)
    expect(resultado.porColor).toEqual({ Blanco: 2.4 })
  })

  it('cuenta solo el lado que lleva cinta', () => {
    const resultado = calcularMetrosCinta([
      { largo: 900, ancho: 500, cantidad: 1, bordes: { sup: 'Roble' } },
    ])
    expect(resultado.total).toBe(0.9)
    expect(resultado.porColor).toEqual({ Roble: 0.9 })
  })

  it('separa metros por color y multiplica por cantidad', () => {
    const resultado = calcularMetrosCinta([
      { largo: 1000, ancho: 500, cantidad: 2, bordes: { sup: 'Blanco', der: 'Roble' } },
      { largo: 700, ancho: 300, cantidad: 1, bordes: { inf: 'Blanco' } },
    ])
    // Blanco: 1000*2 + 700 = 2700 mm; Roble: 500*2 = 1000 mm
    expect(resultado.porColor).toEqual({ Blanco: 2.7, Roble: 1 })
    expect(resultado.total).toBe(3.7)
  })

  it('no cambia la suma por color cuando la pieza se rota', () => {
    const original = calcularMetrosCinta([
      { largo: 900, ancho: 400, cantidad: 1, bordes: { sup: 'Blanco', izq: 'Roble' } },
    ])
    const rotada = calcularMetrosCinta([
      {
        largo: 400,
        ancho: 900,
        cantidad: 1,
        bordes: rotarBordes({ sup: 'Blanco', izq: 'Roble' }),
      },
    ])
    expect(rotada).toEqual(original)
  })

  it('ignora lados sin color, cantidades inválidas y piezas sin cinta', () => {
    expect(
      calcularMetrosCinta([
        { largo: 1000, ancho: 1000, cantidad: 0, bordes: { sup: 'Blanco' } },
        { largo: 1000, ancho: 500, cantidad: 1, bordes: {} },
      ]),
    ).toEqual({ total: 0, porColor: {} })
  })

  it('redondea a centímetros de metro', () => {
    const resultado = calcularMetrosCinta([
      { largo: 333, ancho: 333, cantidad: 1, bordes: { sup: 'Blanco', inf: 'Blanco' } },
    ])
    expect(resultado.total).toBe(0.67)
  })
})

describe('rotarBordes', () => {
  it('mueve cada lado 90° en sentido horario conservando los colores', () => {
    expect(rotarBordes({ sup: 'A', der: 'B', inf: 'C', izq: 'D' })).toEqual({
      der: 'A',
      inf: 'B',
      izq: 'C',
      sup: 'D',
    })
  })
})

describe('largoDeLado', () => {
  it('usa largo en sup/inf y ancho en izq/der', () => {
    expect(largoDeLado('sup', 900, 400)).toBe(900)
    expect(largoDeLado('inf', 900, 400)).toBe(900)
    expect(largoDeLado('izq', 900, 400)).toBe(400)
    expect(largoDeLado('der', 900, 400)).toBe(400)
  })
})

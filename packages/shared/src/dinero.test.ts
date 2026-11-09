import { describe, expect, it } from 'vitest'

import { comparar, dinero, multiplicar, restar, sumar } from './dinero'

describe('dinero (decimal.js)', () => {
  it('suma montos sin error de punto flotante', () => {
    expect(sumar('0.10', '0.20')).toBe('0.30')
    expect(sumar('0.01', '0.02')).toBe('0.03')
    expect(sumar('14.60', '1.50')).toBe('16.10')
    expect(sumar('1.05', '2.95')).toBe('4.00')
  })

  it('normaliza cualquier valor a dos decimales', () => {
    expect(dinero(3)).toBe('3.00')
    expect(dinero('1.5')).toBe('1.50')
    expect(dinero('14.6')).toBe('14.60')
  })

  it('multiplica y redondea a dos decimales', () => {
    expect(multiplicar('14.60', 3)).toBe('43.80')
    expect(multiplicar('0.33', 3)).toBe('0.99')
    expect(multiplicar('1.005', 1)).toBe('1.01')
  })

  it('resta y compara montos', () => {
    expect(restar('16.10', '1.50')).toBe('14.60')
    expect(comparar('0.30', '0.10')).toBe(1)
    expect(comparar('0.10', '0.30')).toBe(-1)
    expect(comparar('1.00', '1.00')).toBe(0)
  })
})

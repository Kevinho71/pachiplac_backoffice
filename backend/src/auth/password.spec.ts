import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password (bcrypt)', () => {
  it('hashea y verifica la contraseña correcta', async () => {
    const hash = await hashPassword('secreto123')

    expect(hash).not.toBe('secreto123')
    await expect(verifyPassword('secreto123', hash)).resolves.toBe(true)
  })

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hashPassword('secreto123')

    await expect(verifyPassword('otra-clave', hash)).resolves.toBe(false)
  })

  it('genera un salt distinto para cada hash', async () => {
    const a = await hashPassword('secreto123')
    const b = await hashPassword('secreto123')

    expect(a).not.toBe(b)
  })
})

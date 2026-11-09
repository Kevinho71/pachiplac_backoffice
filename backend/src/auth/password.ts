import * as bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/** Genera el hash bcrypt de una contraseña en texto plano. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

/** Verifica una contraseña en texto plano contra su hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

import { describe, expect, it } from 'vitest'
import { AuthConfigService } from './auth-config.service'

describe('AuthConfigService', () => {
  it('usa valores por defecto en desarrollo sin JWT_SECRET', () => {
    const prev = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    try {
      const config = new AuthConfigService()

      expect(config.jwtSecret.length).toBeGreaterThan(16)
      expect(config.cookieSecure).toBe(false)
      expect(config.cookieSameSite).toBe('lax')
      expect(config.cookieName).toBe('pachiplac_session')
    } finally {
      if (prev !== undefined) process.env.JWT_SECRET = prev
    }
  })

  it('fuerza Secure cuando COOKIE_SECURE=true', () => {
    const prev = process.env.COOKIE_SECURE
    process.env.COOKIE_SECURE = 'true'
    try {
      const config = new AuthConfigService()
      expect(config.cookieSecure).toBe(true)
    } finally {
      if (prev !== undefined) process.env.COOKIE_SECURE = prev
      else delete process.env.COOKIE_SECURE
    }
  })

  it('falla en producción sin JWT_SECRET', () => {
    const prevEnv = process.env.NODE_ENV
    const prevSecret = process.env.JWT_SECRET
    process.env.NODE_ENV = 'production'
    delete process.env.JWT_SECRET
    try {
      expect(() => new AuthConfigService()).toThrow(/JWT_SECRET/)
    } finally {
      if (prevEnv !== undefined) process.env.NODE_ENV = prevEnv
      else delete process.env.NODE_ENV
      if (prevSecret !== undefined) process.env.JWT_SECRET = prevSecret
    }
  })
})

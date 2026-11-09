import type { CookieOptions, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { AuthConfigService } from './auth-config.service'
import { SesionCookieService } from './sesion-cookie.service'

type CookieFn = (name: string, value: string, options: CookieOptions) => unknown
type ClearCookieFn = (name: string, options: CookieOptions) => unknown

describe('SesionCookieService', () => {
  it('emite la cookie httpOnly con SameSite y maxAge', () => {
    const config = new AuthConfigService()
    const service = new SesionCookieService(config)
    const cookie = vi.fn<CookieFn>()
    const res = { cookie } as unknown as Response

    service.emitir(res, 'token-abc')

    const [nombre, valor, opciones] = cookie.mock.calls[0]
    expect(nombre).toBe(config.cookieName)
    expect(valor).toBe('token-abc')
    expect(opciones.httpOnly).toBe(true)
    expect(opciones.sameSite).toBe('lax')
    expect(opciones.path).toBe('/')
    expect(opciones.maxAge).toBeGreaterThan(0)
  })

  it('marca la cookie como Secure cuando la config lo exige', () => {
    const prev = process.env.COOKIE_SECURE
    process.env.COOKIE_SECURE = 'true'
    try {
      const config = new AuthConfigService()
      const service = new SesionCookieService(config)
      const cookie = vi.fn<CookieFn>()
      const res = { cookie } as unknown as Response

      service.emitir(res, 'token-abc')

      const [, , opciones] = cookie.mock.calls[0]
      expect(opciones.secure).toBe(true)
    } finally {
      if (prev !== undefined) process.env.COOKIE_SECURE = prev
      else delete process.env.COOKIE_SECURE
    }
  })

  it('limpia la cookie en el logout', () => {
    const config = new AuthConfigService()
    const service = new SesionCookieService(config)
    const clearCookie = vi.fn<ClearCookieFn>()
    const res = { clearCookie } as unknown as Response

    service.limpiar(res)

    const [nombre] = clearCookie.mock.calls[0]
    expect(nombre).toBe(config.cookieName)
  })
})

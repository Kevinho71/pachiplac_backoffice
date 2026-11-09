import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { AuthGuard } from './auth.guard'
import { AuthConfigService } from './auth-config.service'

interface ContextoSimulado {
  context: ExecutionContext
  req: Record<string, unknown>
}

function crearContexto(cookies?: Record<string, string>): ContextoSimulado {
  const req: Record<string, unknown> = { cookies }
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext
  return { context, req }
}

describe('AuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' })
  const config = new AuthConfigService()

  it('rechaza cuando no hay cookie de sesión', async () => {
    const guard = new AuthGuard(jwt, config)
    const { context } = crearContexto({})

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('adjunta el usuario al verificar un token válido', async () => {
    const token = await jwt.signAsync({ sub: 5, email: 'a@b.c', sucursalId: null })
    const guard = new AuthGuard(jwt, config)
    const { context, req } = crearContexto({ [config.cookieName]: token })

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(req.usuario).toEqual({ id: 5, email: 'a@b.c', sucursalId: null })
  })

  it('adjunta la sucursal activa cuando viene en el token', async () => {
    const token = await jwt.signAsync({ sub: 5, email: 'a@b.c', sucursalId: 2 })
    const guard = new AuthGuard(jwt, config)
    const { context, req } = crearContexto({ [config.cookieName]: token })

    await guard.canActivate(context)
    expect(req.usuario).toEqual({ id: 5, email: 'a@b.c', sucursalId: 2 })
  })

  it('rechaza un token manipulado', async () => {
    const token = await jwt.signAsync({ sub: 5, email: 'a@b.c', sucursalId: null })
    const guard = new AuthGuard(jwt, config)
    const { context } = crearContexto({ [config.cookieName]: `${token}x` })

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })
})

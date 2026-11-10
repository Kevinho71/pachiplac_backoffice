import { BadRequestException, UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { SucursalGuard } from './sucursal.guard'

function crearContexto(usuario?: { id: number; email: string; sucursalId: number | null }) {
  const req = { usuario }
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext
  return { context, req }
}

describe('SucursalGuard', () => {
  const guard = new SucursalGuard()

  it('rechaza cuando no hay sesión', () => {
    const { context } = crearContexto(undefined)
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('rechaza cuando la sesión no tiene sucursal activa', () => {
    const { context } = crearContexto({ id: 1, email: 'a@b.c', sucursalId: null })
    expect(() => guard.canActivate(context)).toThrow(BadRequestException)
  })

  it('permite cuando hay una sucursal activa', () => {
    const { context } = crearContexto({ id: 1, email: 'a@b.c', sucursalId: 2 })
    expect(guard.canActivate(context)).toBe(true)
  })
})

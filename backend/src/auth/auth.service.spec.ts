import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../prisma/prisma.service'
import { AuthService } from './auth.service'
import { hashPassword } from './password'
import type { SesionPayload } from './sesion.types'

interface UsuarioMock {
  id: number
  email: string
  passwordHash: string
}

function prismaMock(usuario: UsuarioMock | null): PrismaService {
  return {
    usuario: {
      findUnique: vi.fn().mockResolvedValue(usuario),
    },
  } as unknown as PrismaService
}

describe('AuthService.login', () => {
  const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '5m' } })

  it('devuelve usuario y token con credenciales válidas', async () => {
    const passwordHash = await hashPassword('secreto123')
    const prisma = prismaMock({ id: 1, email: 'admin@pachiplac.com', passwordHash })
    const service = new AuthService(prisma, jwt)

    const resultado = await service.login('admin@pachiplac.com', 'secreto123')

    expect(resultado.usuario).toEqual({ id: 1, email: 'admin@pachiplac.com' })
    const payload = await jwt.verifyAsync<SesionPayload>(resultado.token)
    expect(payload.sub).toBe(1)
    expect(payload.email).toBe('admin@pachiplac.com')
    expect(payload.sucursalId).toBeNull()
  })

  it('lanza UnauthorizedException con contraseña incorrecta', async () => {
    const passwordHash = await hashPassword('secreto123')
    const prisma = prismaMock({ id: 1, email: 'admin@pachiplac.com', passwordHash })
    const service = new AuthService(prisma, jwt)

    await expect(service.login('admin@pachiplac.com', 'clave-mala')).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('lanza UnauthorizedException con correo inexistente', async () => {
    const prisma = prismaMock(null)
    const service = new AuthService(prisma, jwt)

    await expect(service.login('nadie@pachiplac.com', 'secreto123')).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('no expone el hash de la contraseña en la respuesta', async () => {
    const passwordHash = await hashPassword('secreto123')
    const prisma = prismaMock({ id: 2, email: 'dueño@pachiplac.com', passwordHash })
    const service = new AuthService(prisma, jwt)

    const resultado = await service.login('dueño@pachiplac.com', 'secreto123')

    expect(resultado.usuario).not.toHaveProperty('passwordHash')
  })
})

describe('AuthService.firmarConSucursal', () => {
  const jwt = new JwtService({ secret: 'test-secret' })

  it('firma un token con el sucursalId en el payload', async () => {
    const prisma = prismaMock(null)
    const service = new AuthService(prisma, jwt)

    const token = await service.firmarConSucursal({ id: 7, email: 'admin@pachiplac.com' }, 3)
    const payload = await jwt.verifyAsync<SesionPayload>(token)

    expect(payload.sub).toBe(7)
    expect(payload.sucursalId).toBe(3)
  })

  it('verificar rechaza un token firmado con otro secreto', async () => {
    const prisma = prismaMock(null)
    const service = new AuthService(prisma, jwt)
    const token = await service.firmarConSucursal({ id: 7, email: 'admin@pachiplac.com' }, 3)

    const otroJwt = new JwtService({ secret: 'otro-secreto' })
    await expect(otroJwt.verifyAsync(token)).rejects.toThrow()
  })
})

import { describe, expect, it, vi } from 'vitest'

import { ServiceUnavailableException } from '@nestjs/common'

import type { PrismaService } from '../prisma/prisma.service'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('responde ok cuando la base responde', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) }
    const controller = new HealthController(prisma as unknown as PrismaService)

    const respuesta = await controller.check()

    expect(respuesta.status).toBe('ok')
    expect(respuesta.db).toBe('up')
    expect(prisma.$queryRaw).toHaveBeenCalled()
  })

  it('devuelve 503 cuando la base no responde', async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error('sin conexión')) }
    const controller = new HealthController(prisma as unknown as PrismaService)

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException)
  })
})

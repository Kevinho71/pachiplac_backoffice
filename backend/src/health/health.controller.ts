import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

interface HealthResponse {
  status: 'ok'
  db: 'up'
  timestamp: string
}

/** Chequeo público para el balanceador / App Runner (no requiere sesión). */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      throw new ServiceUnavailableException('La base de datos no responde')
    }

    return { status: 'ok', db: 'up', timestamp: new Date().toISOString() }
  }
}

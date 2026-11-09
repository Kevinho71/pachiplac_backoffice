import { Injectable } from '@nestjs/common'
import type { Sucursal } from '@pachiplac/shared'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista las sucursales activas para el selector. */
  async listar(): Promise<Sucursal[]> {
    const sucursales = await this.prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { id: 'asc' },
    })

    return sucursales.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      ciudad: s.ciudad,
      direccion: s.direccion,
      telefono: s.telefono,
      activa: s.activa,
    }))
  }

  /** Indica si existe una sucursal activa con ese id. */
  async existeActiva(id: number): Promise<boolean> {
    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id, activa: true },
      select: { id: true },
    })
    return sucursal !== null
  }
}

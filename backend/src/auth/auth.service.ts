import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { verifyPassword } from './password'
import type { SesionPayload } from './sesion.types'

interface DatosUsuario {
  id: number
  email: string
}

export interface ResultadoLogin {
  usuario: DatosUsuario
  token: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Valida credenciales y emite un token de sesión (sin sucursal aún). */
  async login(email: string, password: string): Promise<ResultadoLogin> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } })
    if (!usuario || !(await verifyPassword(password, usuario.passwordHash))) {
      // Mismo mensaje para correo inexistente y contraseña incorrecta:
      // no revela si el correo está registrado.
      throw new UnauthorizedException('Correo o contraseña incorrectos')
    }

    return {
      usuario: { id: usuario.id, email: usuario.email },
      token: await this.firmar({ id: usuario.id, email: usuario.email }, null),
    }
  }

  /** Re-firma el token fijando la sucursal activa en la sesión. */
  async firmarConSucursal(usuario: DatosUsuario, sucursalId: number): Promise<string> {
    return this.firmar(usuario, sucursalId)
  }

  /** Verifica un token y devuelve su payload. */
  async verificar(token: string): Promise<SesionPayload> {
    return this.jwt.verifyAsync<SesionPayload>(token)
  }

  private async firmar(usuario: DatosUsuario, sucursalId: number | null): Promise<string> {
    const payload: SesionPayload = {
      sub: usuario.id,
      email: usuario.email,
      sucursalId,
    }
    return this.jwt.signAsync(payload)
  }
}

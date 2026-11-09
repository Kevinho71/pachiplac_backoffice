import { Module } from '@nestjs/common'
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt'
import { AuthConfigService } from './auth-config.service'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { SesionCookieService } from './sesion-cookie.service'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AuthConfigService],
      useFactory: (config: AuthConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn as JwtSignOptions['expiresIn'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthConfigService, AuthService, SesionCookieService, AuthGuard],
  exports: [AuthService, SesionCookieService, AuthGuard, AuthConfigService, JwtModule],
})
export class AuthModule {}

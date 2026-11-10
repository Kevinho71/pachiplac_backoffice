import { Module } from '@nestjs/common'
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt'
import { AuthConfigModule } from './auth-config.module'
import { AuthConfigService } from './auth-config.service'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { SesionCookieService } from './sesion-cookie.service'
import { SucursalGuard } from '../common/guards/sucursal.guard'

@Module({
  imports: [
    AuthConfigModule,
    JwtModule.registerAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigService],
      useFactory: (config: AuthConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn as JwtSignOptions['expiresIn'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SesionCookieService, AuthGuard, SucursalGuard],
  exports: [
    AuthService,
    SesionCookieService,
    AuthGuard,
    SucursalGuard,
    AuthConfigModule,
    JwtModule,
  ],
})
export class AuthModule {}

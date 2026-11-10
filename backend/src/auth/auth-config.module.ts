import { Module } from '@nestjs/common'

import { AuthConfigService } from './auth-config.service'

/**
 * Módulo mínimo que expone `AuthConfigService` para poder inyectarlo en
 * `JwtModule.registerAsync` sin crear una dependencia circular con `AuthModule`.
 */
@Module({
  providers: [AuthConfigService],
  exports: [AuthConfigService],
})
export class AuthConfigModule {}

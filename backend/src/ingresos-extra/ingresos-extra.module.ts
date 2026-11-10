import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { IngresosExtraController } from './ingresos-extra.controller'
import { IngresosExtraService } from './ingresos-extra.service'

@Module({
  imports: [AuthModule],
  controllers: [IngresosExtraController],
  providers: [IngresosExtraService],
  exports: [IngresosExtraService],
})
export class IngresosExtraModule {}

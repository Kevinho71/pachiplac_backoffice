import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { LaminasController } from './laminas.controller'
import { LaminasService } from './laminas.service'

@Module({
  imports: [AuthModule],
  controllers: [LaminasController],
  providers: [LaminasService],
  exports: [LaminasService],
})
export class LaminasModule {}

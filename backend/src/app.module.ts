import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './auth/auth.module'
import { ClientesModule } from './clientes/clientes.module'
import { ComprasModule } from './compras/compras.module'
import { HealthModule } from './health/health.module'
import { IngresosExtraModule } from './ingresos-extra/ingresos-extra.module'
import { LaminasModule } from './laminas/laminas.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProductosModule } from './productos/productos.module'
import { StockModule } from './stock/stock.module'
import { SucursalesModule } from './sucursales/sucursales.module'
import { VentasModule } from './ventas/ventas.module'

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    AuthModule,
    SucursalesModule,
    ProductosModule,
    LaminasModule,
    ComprasModule,
    StockModule,
    ClientesModule,
    VentasModule,
    IngresosExtraModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

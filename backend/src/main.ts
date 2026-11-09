import 'reflect-metadata'
import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.use(cookieParser())

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  })

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
}

void bootstrap()

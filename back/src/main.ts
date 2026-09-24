import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // Render pone un proxy delante y el socket siempre viene de él: sin esto
  // `req.ip` es la IP del proxy y el límite de los formularios sería uno solo
  // para todos los visitantes. Con `true` se toma la primera de
  // X-Forwarded-For, que el cliente puede inventar; se prefiere así porque el
  // error contrario —juntar a todos en una IP— bloquearía a clientes reales.
  app.set('trust proxy', true)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
  app.enableCors({
    // acepta el dominio con y sin www: son orígenes distintos para CORS
    origin: [frontendUrl, frontendUrl.replace('://', '://www.')],
    credentials: true,
  })
  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()

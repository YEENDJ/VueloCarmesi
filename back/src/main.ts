import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
  app.enableCors({
    // acepta el dominio con y sin www: son orígenes distintos para CORS
    origin: [frontendUrl, frontendUrl.replace('://', '://www.')],
    credentials: true,
  })
  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()

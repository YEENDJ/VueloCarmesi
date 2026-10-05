import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'

async function bootstrap() {
  // `rawBody`: el webhook de pagos verifica la firma sobre los bytes exactos
  // que mandó la pasarela. El JSON ya parseado y vuelto a serializar no da la
  // misma firma. No cambia nada para el resto de rutas: `req.body` sigue igual.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })
  // Render pone un proxy delante y el socket siempre viene de él: sin esto
  // `req.ip` es la IP del proxy y el límite de los formularios sería uno solo
  // para todos los visitantes. Con `true` se toma la primera de
  // X-Forwarded-For, que el cliente puede inventar; se prefiere así porque el
  // error contrario —juntar a todos en una IP— bloquearía a clientes reales.
  app.set('trust proxy', true)
  // Anunciar «X-Powered-By: Express» solo le ahorra trabajo a quien busca qué
  // atacar. Tampoco hacen falta más cabeceras: el backend solo responde JSON y
  // no sirve páginas que se puedan incrustar o interpretar como HTML.
  app.disable('x-powered-by')
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
  // Orígenes de más, separados por coma: el front publicado en otro dominio
  // mientras se prueba (p. ej. el `*.netlify.app` antes de mover el dominio).
  // Vacío en el día a día; si se deja puesto, ese dominio también puede usar
  // los formularios, nada más.
  const extra = (process.env.CORS_ORIGENES_EXTRA ?? '').split(',').map(o => o.trim()).filter(Boolean)
  app.enableCors({
    // acepta el dominio con y sin www: son orígenes distintos para CORS
    origin: [frontendUrl, frontendUrl.replace('://', '://www.'), ...extra],
    // Sin credenciales: ninguna petición del navegador al backend lleva cookies.
    // El panel habla por el puente del front, de servidor a servidor.
    credentials: false,
  })
  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()

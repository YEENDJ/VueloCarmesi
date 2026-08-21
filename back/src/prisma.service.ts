import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly logger = new Logger(PrismaService.name)
  private pool: Pool

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Neon suspende el compute tras unos minutos sin actividad: soltamos las
      // conexiones ociosas antes para no reutilizar sockets ya muertos
      idleTimeoutMillis: 20_000,
      // el arranque en frío de Neon tarda ~1-3 s, damos margen antes de fallar
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
    })
    // sin este listener, un error en un cliente ocioso (p. ej. cuando Neon corta
    // la conexión al suspenderse) tumba el proceso de Node entero
    pool.on('error', (err) => {
      PrismaService.logger.warn(`Conexión de Postgres perdida: ${err.message}`)
    })
    const adapter = new PrismaPg(pool)
    super({ adapter })
    this.pool = pool
  }

  async onModuleInit() {
    await this.connectWithRetry()
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool.end()
  }

  // el primer intento puede caer mientras Neon despierta: reintentamos con espera
  private async connectWithRetry(intentos = 3, esperaMs = 2_000) {
    for (let intento = 1; intento <= intentos; intento++) {
      try {
        await this.$connect()
        return
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : String(err)
        if (intento === intentos) {
          PrismaService.logger.error(`No se pudo conectar a la base de datos: ${mensaje}`)
          throw err
        }
        PrismaService.logger.warn(
          `Base de datos no disponible (intento ${intento}/${intentos}): ${mensaje}. Reintentando...`,
        )
        await new Promise((resolve) => setTimeout(resolve, esperaMs * intento))
      }
    }
  }
}

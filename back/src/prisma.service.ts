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
      // el pooler de Supabase free admite pocas conexiones a la vez y las
      // comparte con los scripts locales y el respaldo: no acapararlas
      max: 5,
      // soltamos las conexiones ociosas pronto para no reutilizar sockets que
      // el pooler (o Neon, si se cambia a la reserva) ya cerró
      idleTimeoutMillis: 20_000,
      // margen para el arranque en frío de Neon (~1-3 s) si se usa la reserva
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
    })
    // sin este listener, un error en un cliente ocioso (p. ej. cuando la base
    // corta la conexión) tumba el proceso de Node entero
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

  // el primer intento puede caer mientras la base despierta: reintentamos con espera
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

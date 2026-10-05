import { Global, Module } from '@nestjs/common'
import { HistorialSlugs } from './historial-slugs.service'
import { PrismaService } from '../prisma.service'

/**
 * Global por lo mismo que TraduccionModule: lo usan experiencias, productos y
 * el sincronizador de traducciones, y no guarda nada por consumidor.
 */
@Global()
@Module({
  providers: [HistorialSlugs, PrismaService],
  exports: [HistorialSlugs],
})
export class SlugsModule {}

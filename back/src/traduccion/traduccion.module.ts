import { Global, Module } from '@nestjs/common'
import { TraduccionService } from './traduccion.service'
import { SincronizadorTraduccion } from './sincronizador.service'
import { PrismaService } from '../prisma.service'

/**
 * Global porque lo van a usar experiencias y productos, y con el tiempo
 * cualquier otra ficha con texto. Importarlo en cada modulo no aporta nada:
 * no tiene estado por consumidor, solo el cliente de DeepL y el glosario.
 */
@Global()
@Module({
  providers: [TraduccionService, SincronizadorTraduccion, PrismaService],
  exports: [TraduccionService, SincronizadorTraduccion],
})
export class TraduccionModule {}

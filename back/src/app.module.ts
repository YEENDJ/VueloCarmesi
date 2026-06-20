import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { ExperienciasModule } from './experiencias/experiencias.module'
import { ReservasModule } from './reservas/reservas.module'
import { ProductosModule } from './productos/productos.module'
import { PedidosModule } from './pedidos/pedidos.module'

@Module({
  imports: [ExperienciasModule, ReservasModule, ProductosModule, PedidosModule],
  providers: [PrismaService],
})
export class AppModule {}

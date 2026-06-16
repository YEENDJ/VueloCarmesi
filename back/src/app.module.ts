import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExperienciasModule } from './experiencias/experiencias.module';
import { ReservasModule } from './reservas/reservas.module';
import { ProductosModule } from './productos/productos.module';
import { PedidosModule } from './pedidos/pedidos.module';

@Module({
  imports: [ExperienciasModule, ReservasModule, ProductosModule, PedidosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

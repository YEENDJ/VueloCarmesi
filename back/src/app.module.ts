import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { ExperienciasModule } from './experiencias/experiencias.module'
import { ReservasModule } from './reservas/reservas.module'
import { ProductosModule } from './productos/productos.module'
import { PedidosModule } from './pedidos/pedidos.module'
import { ContactoModule } from './contacto/contacto.module'
import { NotificacionesModule } from './notificaciones/notificaciones.module'
import { UploadsModule } from './uploads/uploads.module'
import { SiteConfigModule } from './site-config/site-config.module'

@Module({
  imports: [
    ExperienciasModule,
    ReservasModule,
    ProductosModule,
    PedidosModule,
    ContactoModule,
    NotificacionesModule,
    UploadsModule,
    SiteConfigModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}

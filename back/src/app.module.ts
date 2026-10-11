import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { LIMITES_FORMULARIOS } from './common/limite-formularios'
import { PrismaService } from './prisma.service'
import { AppController } from './app.controller'
import { ExperienciasModule } from './experiencias/experiencias.module'
import { ReservasModule } from './reservas/reservas.module'
import { ProductosModule } from './productos/productos.module'
import { PedidosModule } from './pedidos/pedidos.module'
import { ContactoModule } from './contacto/contacto.module'
import { SolicitudesGrupoModule } from './solicitudes-grupo/solicitudes-grupo.module'
import { NotificacionesModule } from './notificaciones/notificaciones.module'
import { UploadsModule } from './uploads/uploads.module'
import { SiteConfigModule } from './site-config/site-config.module'
import { TraduccionModule } from './traduccion/traduccion.module'
import { PagosModule } from './pagos/pagos.module'
import { SlugsModule } from './slugs/slugs.module'
import { AvesModule } from './aves/aves.module'

@Module({
  imports: [
    ThrottlerModule.forRoot(LIMITES_FORMULARIOS),
    ExperienciasModule,
    ReservasModule,
    ProductosModule,
    PedidosModule,
    ContactoModule,
    SolicitudesGrupoModule,
    NotificacionesModule,
    UploadsModule,
    SiteConfigModule,
    TraduccionModule,
    PagosModule,
    SlugsModule,
    AvesModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}

import { Logger, Module } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'
import { PagosController } from './pagos.controller'
import { PagosService } from './pagos.service'
import { VencimientoService } from './vencimiento.service'
import { PROVEEDOR_PAGOS, type ProveedorPagos } from './proveedor'
import { ProveedorFalso } from './proveedor-falso'
import { ProveedorWompi } from './proveedor-wompi'

/**
 * El adaptador según `PAGOS_PROVEEDOR`. Sin la variable no hay proveedor y el
 * cobro en línea queda apagado: pedidos y reservas siguen el flujo manual.
 *
 * Un nombre desconocido también lo deja apagado, con un ERROR en el log, en
 * vez de tumbar el arranque: una errata en Render no debe dejar el sitio sin
 * backend, y apagado es el comportamiento de siempre. Lo mismo con credenciales
 * de Wompi faltantes o mezcladas entre sandbox y producción.
 */
export function crearProveedor(nombre = process.env.PAGOS_PROVEEDOR?.trim()): ProveedorPagos | null {
  if (!nombre) return null
  if (nombre === 'falso') {
    new Logger('Pagos').warn('Pasarela FALSA activa: los pagos no cobran nada. No usar en producción')
    return new ProveedorFalso()
  }
  if (nombre === 'wompi') {
    try {
      const wompi = new ProveedorWompi()
      if (wompi.modo === 'prueba') new Logger('Pagos').warn('Wompi en SANDBOX: los pagos no cobran nada')
      return wompi
    } catch (err) {
      new Logger('Pagos').error(`Wompi mal configurado: ${(err as Error).message}. El cobro en línea queda apagado`)
      return null
    }
  }
  new Logger('Pagos').error(`PAGOS_PROVEEDOR «${nombre}» no existe: el cobro en línea queda apagado`)
  return null
}

@Module({
  imports: [NotificacionesModule],
  controllers: [PagosController],
  providers: [
    PagosService,
    VencimientoService,
    PrismaService,
    { provide: PROVEEDOR_PAGOS, useFactory: () => crearProveedor() },
  ],
  exports: [PagosService, VencimientoService],
})
export class PagosModule {}

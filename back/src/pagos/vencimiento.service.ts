import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { devolverStock } from '../pedidos/stock.util'
import { HORAS_VENTANA_CONCILIACION, MINUTOS_ANTES_DE_CONCILIAR } from './config'
import { tienePagoEnCurso } from './estados'
import { PagosService } from './pagos.service'
import { PROVEEDOR_PAGOS, type ProveedorPagos } from './proveedor'

/** Por pasada. Lo que no alcance entra en la siguiente. */
const LOTE = 50

/**
 * Vencimiento y conciliación. No corre sola: el backend puede estar dormido en
 * Render y un temporizador dentro del proceso no despertaría. La disparan
 * `POST /pagos/mantenimiento` —que llama un cron externo— y la creación de
 * pedidos, que la necesita para recuperar el stock justo antes de venderlo.
 *
 * Todo es idempotente: dos pasadas a la vez no vencen nada dos veces.
 */
@Injectable()
export class VencimientoService {
  private readonly logger = new Logger(VencimientoService.name)

  constructor(
    private prisma: PrismaService,
    private pagos: PagosService,
    @Optional() @Inject(PROVEEDOR_PAGOS) private proveedor: ProveedorPagos | null,
  ) {}

  /**
   * Primero concilia. No es por corrección —un pago que aparece después de
   * vencer revive el pedido igual (caso 5)— sino para no soltar y volver a
   * apartar el stock en la misma pasada.
   */
  async mantenimiento(ahora = new Date()) {
    const conciliados = await this.conciliar(ahora)
    const vencidos = await this.vencerPendientes(ahora)
    return { conciliados, ...vencidos }
  }

  /**
   * Vence lo que esperaba pago y se quedó sin él: el pedido pasa a `expirado`
   * y devuelve el stock; la reserva pasa a `expirada` (caso 1).
   */
  async vencerPendientes(ahora = new Date()): Promise<{ pedidos: number; reservas: number }> {
    let pedidos = 0
    let reservas = 0

    const pedidosVencidos = await this.prisma.pedido.findMany({
      where: { estado: 'pendiente_pago', venceEn: { lt: ahora } },
      include: { items: true, pagos: true },
      take: LOTE,
    })
    for (const pedido of pedidosVencidos) {
      if (tienePagoEnCurso(pedido.pagos, ahora)) continue
      const vencio = await this.prisma.$transaction(async tx => {
        // Condición en el WHERE: si el pago se aprobó entre la lectura y
        // aquí, el pedido ya no está en `pendiente_pago` y no se toca.
        const { count } = await tx.pedido.updateMany({
          where: { id: pedido.id, estado: 'pendiente_pago' },
          data: { estado: 'expirado' },
        })
        if (count === 0) return false
        await devolverStock(tx, pedido.id, pedido.items)
        await tx.pago.updateMany({ where: { pedidoId: pedido.id, estado: 'pendiente' }, data: { estado: 'expirado' } })
        return true
      })
      if (vencio) pedidos++
    }

    const reservasVencidas = await this.prisma.reserva.findMany({
      where: { estado: 'pendiente_pago', venceEn: { lt: ahora } },
      include: { pagos: true },
      take: LOTE,
    })
    for (const reserva of reservasVencidas) {
      if (tienePagoEnCurso(reserva.pagos, ahora)) continue
      const vencio = await this.prisma.$transaction(async tx => {
        const { count } = await tx.reserva.updateMany({
          where: { id: reserva.id, estado: 'pendiente_pago' },
          data: { estado: 'expirada' },
        })
        if (count === 0) return false
        await tx.pago.updateMany({ where: { reservaId: reserva.id, estado: 'pendiente' }, data: { estado: 'expirado' } })
        return true
      })
      if (vencio) reservas++
    }

    if (pedidos || reservas) this.logger.log(`Vencidos: ${pedidos} pedidos, ${reservas} reservas`)
    return { pedidos, reservas }
  }

  /**
   * Le pregunta a la pasarela por los pagos sin respuesta: cubre el webhook que
   * nunca llegó (caso 6), el pago aprobado después de vencer (caso 5) y el
   * reintento aprobado después de un rechazo (caso 10).
   */
  async conciliar(ahora = new Date()): Promise<number> {
    if (!this.proveedor) return 0
    const pagos = await this.prisma.pago.findMany({
      where: {
        estado: { in: ['pendiente', 'expirado', 'rechazado', 'error'] },
        proveedor: this.proveedor.nombre,
        createdAt: {
          gte: new Date(ahora.getTime() - HORAS_VENTANA_CONCILIACION * 3_600_000),
          lte: new Date(ahora.getTime() - MINUTOS_ANTES_DE_CONCILIAR * 60_000),
        },
      },
      orderBy: { createdAt: 'asc' },
      take: LOTE,
    })

    let aplicados = 0
    for (const pago of pagos) {
      try {
        const evento = await this.proveedor.consultarTransaccion(pago.referencia)
        if (!evento) continue
        await this.pagos.aplicarEvento(evento)
        aplicados++
      } catch (err) {
        // Uno que falla no frena a los demás; entra en la siguiente pasada.
        this.logger.warn(`Conciliación de ${pago.referencia} fallida: ${(err as Error).message}`)
      }
    }
    return aplicados
  }
}

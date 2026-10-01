import {
  BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException,
  Optional, ServiceUnavailableException,
} from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { reapartarStock, StockInsuficienteError } from '../pedidos/stock.util'
import { puedeTransicionar, tienePagoEnCurso } from './estados'
import { CLAVE_ABONO, leerPorcentajeAbono } from './abono'
import { PROVEEDOR_PAGOS, type EventoPago, type ProveedorPagos } from './proveedor'

type Tx = Prisma.TransactionClient

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

/**
 * A dónde vuelve el cliente desde la pasarela, en su idioma. Es un espejo de
 * `pathnames` en front/lib/i18n/routing.ts —el backend no puede importarlo—:
 * si cambia una de esas rutas, cambia aquí.
 */
const RETORNO = {
  pedido: { es: '/checkout/resultado', en: '/en/checkout/result' },
  reserva: { es: '/reservar/resultado', en: '/en/book/result' },
} as const
export type IdiomaRetorno = keyof typeof RETORNO.pedido

/** Lo que el pago le hizo a su pedido o reserva, para decidir qué avisar. */
type Efecto =
  | { tipo: 'ninguno' }
  | { tipo: 'rechazado' }
  | { tipo: 'pagado' }
  | { tipo: 'revision'; motivo: string }
  | { tipo: 'alerta'; motivo: string }

const INCLUIR_DUENO = {
  pedido: { include: { items: { include: { producto: true } } } },
  reserva: { include: { experiencia: { select: { id: true, nombre: true } } } },
} as const

/**
 * Crea intentos de cobro y aplica lo que la pasarela dice de ellos.
 *
 * Cada caso de la tabla del spec tiene nombre en los comentarios de abajo:
 * docs/superpowers/specs/2026-09-25-pasarela-pagos-design.md.
 */
@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name)

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
    @Optional() @Inject(PROVEEDOR_PAGOS) private proveedor: ProveedorPagos | null,
  ) {}

  /** Si el sitio cobra en línea. Pedidos y reservas lo miran al crearse. */
  get activo(): boolean {
    return this.proveedor != null
  }

  /**
   * Lo que el front necesita saber antes de enviar un formulario: si va a
   * cobrar, y cuánto de una reserva. El porcentaje sale del mismo respaldo que
   * usa la reserva al crearse, así que lo que se anuncia es lo que se cobra.
   */
  async configPublica(): Promise<{ activo: boolean; porcentajeAbono: number }> {
    const fila = await this.prisma.siteConfig.findUnique({ where: { key: CLAVE_ABONO } })
    return { activo: this.activo, porcentajeAbono: leerPorcentajeAbono(fila?.value).porcentaje }
  }

  /**
   * «Intentar de nuevo» desde la página de resultado, que solo conoce la
   * referencia del intento anterior (es lo que viaja en la URL de retorno).
   */
  async reintentar(referencia: string, idioma: IdiomaRetorno = 'es', ahora = new Date()) {
    const anterior = await this.prisma.pago.findUnique({ where: { referencia } })
    if (!anterior) throw new NotFoundException()
    return this.crearIntento(
      { pedidoId: anterior.pedidoId ?? undefined, reservaId: anterior.reservaId ?? undefined, idioma },
      ahora,
    )
  }

  /**
   * Un intento de cobro nuevo sobre un pedido o una reserva que espera pago.
   * Es también el reintento tras un rechazo (caso 3): cada intento lleva su
   * propia referencia y el pedido conserva lo apartado.
   */
  async crearIntento(
    dueno: { pedidoId?: string; reservaId?: string; idioma?: IdiomaRetorno },
    ahora = new Date(),
  ): Promise<{ referencia: string; url: string; monto: number }> {
    const proveedor = this.proveedor
    if (!proveedor) throw new ServiceUnavailableException('El pago en línea no está disponible')
    if (Boolean(dueno.pedidoId) === Boolean(dueno.reservaId)) {
      throw new BadRequestException('Indica un pedido o una reserva')
    }

    const esPedido = Boolean(dueno.pedidoId)
    const registro = esPedido
      ? await this.prisma.pedido.findUnique({ where: { id: dueno.pedidoId }, include: { pagos: true } })
      : await this.prisma.reserva.findUnique({
          where: { id: dueno.reservaId },
          include: { pagos: true, experiencia: { select: { nombre: true } } },
        })
    if (!registro) throw new NotFoundException()

    if (registro.estado !== 'pendiente_pago') {
      throw new ConflictException('Esto ya no espera un pago')
    }
    if (registro.venceEn && registro.venceEn <= ahora) {
      throw new ConflictException('El tiempo para pagar venció. Vuelve a hacer el pedido')
    }
    // PSE o Nequi en curso: un segundo intento ahora terminaría en un cobro
    // doble si el primero se aprueba (caso 4).
    if (tienePagoEnCurso(registro.pagos, ahora)) {
      throw new ConflictException('Hay un pago en curso. Espera la confirmación del banco')
    }

    const monto = esPedido
      ? (registro as { total: number }).total
      : (registro as { montoAbono: number | null }).montoAbono
    if (!monto || monto <= 0) throw new ConflictException('No hay nada que cobrar')

    const referencia = `VC-${esPedido ? 'P' : 'R'}-${registro.id.slice(-8).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const pago = await this.prisma.pago.create({
      data: {
        referencia,
        monto,
        proveedor: proveedor.nombre,
        modo: proveedor.modo,
        ...(esPedido ? { pedidoId: registro.id } : { reservaId: registro.id }),
      },
    })

    const descripcion = esPedido
      ? `Pedido Vuelo Carmesí ${registro.id}`
      : `Abono reserva ${(registro as { experiencia?: { nombre: string } }).experiencia?.nombre ?? ''}`.trim()
    const urlRetorno = `${FRONTEND_URL}${RETORNO[esPedido ? 'pedido' : 'reserva'][dueno.idioma ?? 'es']}`

    try {
      const checkout = await proveedor.crearCheckout(
        { referencia, monto, moneda: pago.moneda, descripcion },
        { nombre: registro.nombre, email: registro.email, telefono: registro.telefono },
        urlRetorno,
      )
      return { referencia, url: checkout.url, monto }
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err)
      this.logger.error(`La pasarela no creó el checkout de ${referencia}: ${motivo}`)
      await this.prisma.pago.update({ where: { id: pago.id }, data: { estado: 'error', motivo } })
      throw new ServiceUnavailableException('La pasarela de pagos no respondió. Intenta de nuevo')
    }
  }

  /**
   * Webhook: verifica la firma y luego le pregunta a la pasarela. Lo que se
   * aplica es lo que responde su API, no lo que trae el evento.
   *
   * La firma de Wompi cubre el id, el estado y el monto de la transacción, pero
   * no la referencia, que es justo lo que dice a qué pedido pertenece. Quien
   * consiguiera un evento aprobado auténtico podría reenviarlo con la
   * referencia de otro pedido del mismo monto. Consultando por la referencia
   * con la llave privada, que nunca sale del servidor, el evento queda en un
   * aviso de «algo cambió».
   *
   * `FirmaInvalidaError` sube al controller (401). Si la consulta falla, el
   * error también sube: el controller responde 500 y la pasarela reintenta.
   */
  async procesarWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    if (!this.proveedor) throw new NotFoundException()
    const evento = this.proveedor.verificarWebhook(rawBody, headers)
    const confirmado = await this.proveedor.consultarTransaccion(evento.referencia)
    if (!confirmado) {
      this.logger.warn(
        `Webhook de ${evento.referencia} (${evento.proveedorTxId}): la pasarela no tiene transacciones con esa referencia. Se ignora`,
      )
      return
    }
    if (confirmado.proveedorTxId !== evento.proveedorTxId || confirmado.estado !== evento.estado) {
      this.logger.warn(
        `Webhook de ${evento.referencia}: decía ${evento.proveedorTxId} «${evento.estado}» y la pasarela dice ` +
        `${confirmado.proveedorTxId} «${confirmado.estado}». Se aplica lo de la pasarela`,
      )
    }
    await this.aplicarEvento(confirmado)
  }

  /**
   * Estado para la página de resultado. No trae datos personales: la
   * referencia viaja en la URL de retorno y cualquiera puede consultarla.
   *
   * Si el pago sigue pendiente le pregunta a la pasarela antes de responder, y
   * así el cliente no depende de que el webhook haya llegado (caso 6).
   */
  async estadoPublico(referencia: string) {
    let pago = await this.prisma.pago.findUnique({ where: { referencia } })
    if (!pago) throw new NotFoundException()

    if (pago.estado === 'pendiente' && this.proveedor) {
      try {
        const evento = await this.proveedor.consultarTransaccion(referencia)
        if (evento) {
          await this.aplicarEvento(evento)
          pago = (await this.prisma.pago.findUnique({ where: { referencia } }))!
        }
      } catch (err) {
        this.logger.warn(`No se pudo consultar ${referencia}: ${(err as Error).message}`)
      }
    }

    const dueno = pago.pedidoId
      ? await this.prisma.pedido.findUnique({
          where: { id: pago.pedidoId }, select: { id: true, estado: true, venceEn: true, total: true },
        })
      : await this.prisma.reserva.findUnique({
          where: { id: pago.reservaId! }, select: { id: true, estado: true, venceEn: true, total: true },
        })

    return {
      referencia: pago.referencia,
      estado: pago.estado,
      monto: pago.monto,
      motivo: pago.estado === 'rechazado' ? pago.motivo : null,
      tipo: pago.pedidoId ? 'pedido' : 'reserva',
      estadoDueno: dueno?.estado ?? null,
      venceEn: dueno?.venceEn ?? null,
      // Para la reserva: el saldo del día. Cifras, no datos personales.
      total: dueno?.total ?? null,
      // El número corto que el cliente ve y cita por WhatsApp, #VC-XXXXXX.
      codigo: dueno ? `VC-${dueno.id.slice(-6).toUpperCase()}` : null,
    }
  }

  /**
   * Aplica un evento de la pasarela: webhook, conciliación o consulta. Es
   * idempotente y tolera el desorden (caso 7): lo que no avanza el estado se
   * ignora.
   */
  async aplicarEvento(evento: EventoPago): Promise<void> {
    const pago = await this.prisma.pago.findUnique({ where: { referencia: evento.referencia } })
    if (!pago) {
      this.logger.warn(`Evento para una referencia desconocida: ${evento.referencia}`)
      return
    }
    // Otra transacción con la misma referencia: solo se acepta si es una
    // aprobación que llega a un pago que no se cobró (caso 10). Cualquier otra
    // cosa de una transacción ajena se ignora.
    const reintentoAprobado = evento.estado === 'aprobado' && ['rechazado', 'expirado', 'error'].includes(pago.estado)
    if (pago.proveedorTxId && pago.proveedorTxId !== evento.proveedorTxId && !reintentoAprobado) {
      this.logger.warn(
        `${pago.referencia}: llegó la transacción ${evento.proveedorTxId}, pero el pago ya es de ${pago.proveedorTxId}. Se ignora`,
      )
      return
    }

    // «Sigue en curso»: no cambia el estado, pero registra la transacción, y
    // con eso el pedido deja de vencer mientras el banco responde (caso 4).
    if (evento.estado === 'pendiente') {
      if (!pago.proveedorTxId && pago.estado === 'pendiente') {
        await this.prisma.pago.updateMany({
          where: { id: pago.id, proveedorTxId: null },
          data: { proveedorTxId: evento.proveedorTxId, metodo: evento.metodo, payload: jsonDe(evento.payload) },
        })
      }
      return
    }

    if (evento.estado === pago.estado) return
    if (!puedeTransicionar(pago.estado, evento.estado)) {
      this.logger.warn(`${pago.referencia}: de «${pago.estado}» a «${evento.estado}» no se permite. Se ignora`)
      return
    }

    let efecto: Efecto | null
    try {
      efecto = await this.prisma.$transaction(tx => this.transicionar(tx, pago.id, pago.estado, evento, true))
    } catch (err) {
      if (!(err instanceof StockInsuficienteError)) throw err
      // Caso 5 sin stock: la primera pasada se deshizo entera. La segunda
      // registra el pago igual —el dinero ya se cobró— y deja el pedido para
      // que lo resuelva una persona.
      efecto = await this.prisma.$transaction(tx => this.transicionar(tx, pago.id, pago.estado, evento, false))
    }
    if (efecto) await this.avisar(pago.id, evento, efecto)
  }

  /**
   * Cambia el pago y aplica el efecto sobre su dueño, dentro de una
   * transacción. Devuelve null si otro proceso ya movió el pago primero.
   */
  private async transicionar(
    tx: Tx, pagoId: string, desde: string, evento: EventoPago, intentarReapartar: boolean,
  ): Promise<Efecto | null> {
    // El estado de origen va en el WHERE: si dos webhooks iguales llegan a la
    // vez, solo uno encuentra la fila como estaba.
    const { count } = await tx.pago.updateMany({
      where: { id: pagoId, estado: desde },
      data: {
        estado: evento.estado,
        proveedorTxId: evento.proveedorTxId,
        metodo: evento.metodo ?? undefined,
        motivo: evento.motivo ?? null,
        payload: jsonDe(evento.payload),
      },
    })
    if (count === 0) return null

    const pago = await tx.pago.findUniqueOrThrow({
      where: { id: pagoId },
      include: { pedido: INCLUIR_DUENO.pedido, reserva: INCLUIR_DUENO.reserva },
    })

    if (evento.estado === 'aprobado') {
      if (evento.monto !== pago.monto) {
        return this.aRevision(tx, pago, `La pasarela cobró ${evento.monto} y se esperaban ${pago.monto}`)
      }
      return pago.pedido
        ? this.aprobarPedido(tx, pago.pedido, intentarReapartar)
        : this.aprobarReserva(tx, pago.reserva!)
    }

    // Caso 8: la plata se devolvió después de aprobada. Lo que ya se despachó
    // o se confirmó no se deshace solo; lo decide una persona.
    if (evento.estado === 'anulado') {
      const estado = pago.pedido?.estado ?? pago.reserva!.estado
      if (['cancelado', 'cancelada', 'expirado', 'expirada'].includes(estado)) {
        return { tipo: 'alerta', motivo: 'Se anuló un pago de algo que ya estaba cancelado' }
      }
      return this.aRevision(tx, pago, 'La pasarela anuló un pago que estaba aprobado')
    }

    // rechazado | error (casos 2 y 3): el pedido sigue esperando hasta vencer
    // para que el cliente pueda reintentar con otro método.
    return evento.estado === 'rechazado' ? { tipo: 'rechazado' } : { tipo: 'ninguno' }
  }

  private async aprobarPedido(
    tx: Tx, pedido: { id: string; estado: string; items: { productoId: string; cantidad: number }[] },
    intentarReapartar: boolean,
  ): Promise<Efecto> {
    if (pedido.estado === 'pendiente_pago') {
      await tx.pedido.update({ where: { id: pedido.id }, data: { estado: 'pagado' } })
      return { tipo: 'pagado' }
    }
    // Caso 5: pagó después de que el pedido venció y soltó el stock.
    if (pedido.estado === 'expirado') {
      if (intentarReapartar) {
        await reapartarStock(tx, pedido.id, pedido.items)
        await tx.pedido.update({ where: { id: pedido.id }, data: { estado: 'pagado' } })
        return { tipo: 'pagado' }
      }
      await tx.pedido.update({ where: { id: pedido.id }, data: { estado: 'requiere_revision' } })
      return {
        tipo: 'revision',
        motivo: 'Pagó después de que el pedido venció y ya no hay stock. Reponer o reembolsar',
      }
    }
    if (pedido.estado === 'cancelado') {
      await tx.pedido.update({ where: { id: pedido.id }, data: { estado: 'requiere_revision' } })
      return { tipo: 'revision', motivo: 'Se aprobó un pago de un pedido cancelado. Reembolsar o reactivar' }
    }
    // pagado, enviado, entregado, requiere_revision: ya había un pago bueno.
    return { tipo: 'alerta', motivo: `Cobro doble: el pedido ya estaba «${pedido.estado}». Reembolsar uno` }
  }

  private async aprobarReserva(tx: Tx, reserva: { id: string; estado: string }): Promise<Efecto> {
    // Pasa a `pendiente`, el mismo estado del flujo manual: el admin la
    // confirma como siempre, ahora con el abono a la vista. Si se decide que
    // el abono la confirme sola, este es el único lugar que cambia.
    //
    // Una expirada también vuelve: sin cupo por fecha no hay nada que se le
    // haya podido dar a otro mientras tanto.
    if (reserva.estado === 'pendiente_pago' || reserva.estado === 'expirada') {
      await tx.reserva.update({ where: { id: reserva.id }, data: { estado: 'pendiente' } })
      return { tipo: 'pagado' }
    }
    if (reserva.estado === 'cancelada') {
      await tx.reserva.update({ where: { id: reserva.id }, data: { estado: 'requiere_revision' } })
      return { tipo: 'revision', motivo: 'Se aprobó el abono de una reserva cancelada. Reembolsar o reactivar' }
    }
    return { tipo: 'alerta', motivo: `Cobro doble: la reserva ya estaba «${reserva.estado}». Reembolsar uno` }
  }

  private async aRevision(
    tx: Tx, pago: { pedidoId: string | null; reservaId: string | null }, motivo: string,
  ): Promise<Efecto> {
    if (pago.pedidoId) {
      await tx.pedido.update({ where: { id: pago.pedidoId }, data: { estado: 'requiere_revision' } })
    } else {
      await tx.reserva.update({ where: { id: pago.reservaId! }, data: { estado: 'requiere_revision' } })
    }
    return { tipo: 'revision', motivo }
  }

  /** Avisos después de confirmar la transacción: un correo caído no deshace un pago. */
  private async avisar(pagoId: string, evento: EventoPago, efecto: Efecto): Promise<void> {
    if (efecto.tipo === 'ninguno') return
    try {
      const pago = await this.prisma.pago.findUniqueOrThrow({
        where: { id: pagoId },
        include: { pedido: INCLUIR_DUENO.pedido, reserva: INCLUIR_DUENO.reserva },
      })

      const dueno = pago.pedido ?? pago.reserva!
      const tipo = pago.pedido ? 'pedido' : 'reserva'

      if (efecto.tipo === 'pagado') {
        // Son los avisos de «nuevo pedido» y «nueva reserva» de siempre: con
        // cobro en línea salen al aprobarse el pago y no al crearse.
        const recibido = { monto: evento.monto }
        if (pago.pedido) await this.notificaciones.enviarConfirmacionPedido(pago.pedido, recibido)
        else await this.notificaciones.enviarConfirmacionReserva(pago.reserva!, recibido)
        return
      }

      if (efecto.tipo === 'rechazado') {
        // Solo si todavía puede reintentar. Un rechazo que llega cuando el
        // pedido ya venció, o ya se pagó con otro intento, no tiene nada que
        // ofrecerle.
        if (dueno.estado !== 'pendiente_pago' || !dueno.venceEn || dueno.venceEn <= new Date()) return
        await this.notificaciones.enviarPagoRechazado({
          tipo,
          nombre: dueno.nombre,
          email: dueno.email,
          referencia: pago.referencia,
          monto: pago.monto,
          venceEn: dueno.venceEn,
        })
        return
      }

      // El dinero le llegó a la finca pero algo impide cumplir: al cliente se le
      // dice que su pago está y que lo contactan. Una anulación no: ahí el
      // dinero volvió a su banco.
      if (efecto.tipo === 'revision' && evento.estado === 'aprobado') {
        await this.notificaciones
          .enviarPagoEnRevisionCliente({
            tipo, id: dueno.id, nombre: dueno.nombre, email: dueno.email, monto: evento.monto,
          })
          .catch(err => this.logger.error(
            `Aviso al cliente del pago ${pago.referencia} fallido`,
            err instanceof Error ? err.stack : String(err),
          ))
      }

      await this.notificaciones.alertarPago({
        motivo: efecto.motivo,
        requiereRevision: efecto.tipo === 'revision',
        tipo,
        id: dueno.id,
        nombre: dueno.nombre,
        email: dueno.email,
        telefono: dueno.telefono,
        referencia: pago.referencia,
        monto: evento.monto,
      })
    } catch (err) {
      this.logger.error(`Aviso del pago ${pagoId} fallido`, err instanceof Error ? err.stack : String(err))
    }
  }
}

function jsonDe(valor: unknown): Prisma.InputJsonValue {
  return valor ?? {}
}

import {
  Body, Controller, Get, HttpCode, Param, Post, Req, UnauthorizedException, UseGuards,
  type RawBodyRequest,
} from '@nestjs/common'
import type { Request } from 'express'
import { AdminGuard } from '../common/guards/admin.guard'
import { LimiteFormularios } from '../common/limite-formularios'
import { CrearPagoDto, ReintentarPagoDto } from './dto/crear-pago.dto'
import { PagosService } from './pagos.service'
import { FirmaInvalidaError } from './proveedor'
import { VencimientoService } from './vencimiento.service'

@Controller('pagos')
export class PagosController {
  constructor(
    private readonly pagos: PagosService,
    private readonly vencimiento: VencimientoService,
  ) {}

  /** Si el sitio cobra en línea y qué porcentaje de una reserva. */
  @Get('config')
  config() {
    return this.pagos.configPublica()
  }

  /** Abre un intento de cobro sobre un pedido o una reserva recién creados. */
  @LimiteFormularios() @Post()
  crear(@Body() dto: CrearPagoDto) {
    return this.pagos.crearIntento(dto)
  }

  /** El botón «Intentar de nuevo» de la página de resultado. */
  @LimiteFormularios() @Post('reintentar/:referencia')
  reintentar(@Param('referencia') referencia: string, @Body() dto: ReintentarPagoDto) {
    return this.pagos.reintentar(referencia, dto.idioma)
  }

  /**
   * Sin límite de formularios: la pasarela llama siempre desde las mismas
   * pocas IPs y un 429 le haría perder eventos. Lo que protege esta ruta es la
   * firma. Un evento que se ignora igual responde 200, para que la pasarela no
   * lo reintente sin fin.
   */
  @Post('webhook') @HttpCode(200)
  async webhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) throw new UnauthorizedException()
    try {
      await this.pagos.procesarWebhook(req.rawBody, req.headers)
    } catch (err) {
      if (err instanceof FirmaInvalidaError) throw new UnauthorizedException()
      throw err
    }
    return { ok: true }
  }

  /** Lo que consulta la página de resultado. Sin datos personales. */
  @Get('estado/:referencia')
  estado(@Param('referencia') referencia: string) {
    return this.pagos.estadoPublico(referencia)
  }

  /**
   * Vencimiento y conciliación. Lo llama un cron externo cada 15 minutos
   * (el backend puede estar dormido y no tiene temporizador propio).
   */
  @UseGuards(AdminGuard) @Post('mantenimiento') @HttpCode(200)
  mantenimiento() {
    return this.vencimiento.mantenimiento()
  }
}

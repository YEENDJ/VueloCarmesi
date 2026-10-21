import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { PedidosService } from './pedidos.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'
import { ConsultarPedidoDto } from './dto/consultar-pedido.dto'
import { LimiteFormularios } from '../common/limite-formularios'

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  // Públicos: el checkout y la página «mi pedido» (por token, o consultando
  // con código y correo; esta última con el límite de los formularios, para
  // que no se puedan probar combinaciones). La vista pública no lleva datos
  // del cliente. Lo demás lleva direcciones y teléfonos y va detrás de AdminGuard.
  @LimiteFormularios() @Post()                       create(@Body() dto: CreatePedidoDto)                             { return this.service.create(dto) }
  @Get('consulta/:token')                            porToken(@Param('token') token: string)                          { return this.service.porToken(token) }
  @LimiteFormularios() @HttpCode(200) @Post('consulta') consultar(@Body() dto: ConsultarPedidoDto)                    { return this.service.consultar(dto) }

  @UseGuards(AdminGuard) @Get()         findAll()                                                        { return this.service.findAll() }
  @UseGuards(AdminGuard) @Get(':id/bloqueo-borrado') bloqueoBorrado(@Param('id') id: string)      { return this.service.bloqueoBorrado(id) }
  @UseGuards(AdminGuard) @Get(':id')    findOne(@Param('id') id: string)                                 { return this.service.findById(id) }
  @UseGuards(AdminGuard) @Patch(':id')  update(@Param('id') id: string, @Body() dto: UpdatePedidoDto)   { return this.service.update(id, dto) }
  @UseGuards(AdminGuard) @Delete(':id') remove(@Param('id') id: string)                                 { return this.service.remove(id) }
}

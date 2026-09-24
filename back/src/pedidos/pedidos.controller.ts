import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { PedidosService } from './pedidos.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'
import { LimiteFormularios } from '../common/limite-formularios'

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  // Solo el POST es público: es el checkout. Lo demás lleva direcciones y
  // teléfonos de clientes y va detrás de AdminGuard.
  @UseGuards(AdminGuard) @Get()         findAll()                                                        { return this.service.findAll() }
  @UseGuards(AdminGuard) @Get(':id')    findOne(@Param('id') id: string)                                 { return this.service.findById(id) }
  @LimiteFormularios() @Post()        create(@Body() dto: CreatePedidoDto)                             { return this.service.create(dto) }
  @UseGuards(AdminGuard) @Patch(':id')  update(@Param('id') id: string, @Body() dto: UpdatePedidoDto)   { return this.service.update(id, dto) }
  @UseGuards(AdminGuard) @Delete(':id') remove(@Param('id') id: string)                                 { return this.service.remove(id) }
}

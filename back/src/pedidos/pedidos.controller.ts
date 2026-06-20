import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common'
import { PedidosService } from './pedidos.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  @Get()       findAll()                              { return this.service.findAll() }
  @Get(':id')  findOne(@Param('id') id: string)       { return this.service.findById(id) }
  @Post()      create(@Body() dto: CreatePedidoDto)   { return this.service.create(dto) }
  @Delete(':id') remove(@Param('id') id: string)      { return this.service.remove(id) }
}

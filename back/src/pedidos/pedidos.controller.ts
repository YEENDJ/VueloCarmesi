import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { PedidosService } from './pedidos.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  @Get()         findAll()                                                        { return this.service.findAll() }
  @Get(':id')    findOne(@Param('id') id: string)                                 { return this.service.findById(id) }
  @Post()        create(@Body() dto: CreatePedidoDto)                             { return this.service.create(dto) }
  @Patch(':id')  update(@Param('id') id: string, @Body() dto: UpdatePedidoDto)   { return this.service.update(id, dto) }
  @Delete(':id') remove(@Param('id') id: string)                                 { return this.service.remove(id) }
}

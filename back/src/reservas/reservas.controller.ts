import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { ReservasService } from './reservas.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateReservaDto } from './dto/update-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'

@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  // Solo el POST es público: es el formulario de reserva. Leer, cambiar de
  // estado o borrar lleva datos de clientes y va detrás de AdminGuard.
  @UseGuards(AdminGuard) @Get()       findAll()                                                                   { return this.service.findAll() }
  @UseGuards(AdminGuard) @Get(':id')  findOne(@Param('id') id: string)                                           { return this.service.findById(id) }
  @Post()      create(@Body() dto: CreateReservaDto)                                      { return this.service.create(dto) }
  @UseGuards(AdminGuard) @Patch(':id/estado') cambiarEstado(@Param('id') id: string, @Body() dto: UpdateEstadoReservaDto) { return this.service.cambiarEstado(id, dto) }
  @UseGuards(AdminGuard) @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateReservaDto) { return this.service.update(id, dto) }
  @UseGuards(AdminGuard) @Delete(':id') remove(@Param('id') id: string)                                         { return this.service.remove(id) }
}

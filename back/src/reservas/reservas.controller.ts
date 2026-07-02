import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ReservasService } from './reservas.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'

@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Get()       findAll()                                                                   { return this.service.findAll() }
  @Get(':id')  findOne(@Param('id') id: string)                                           { return this.service.findById(id) }
  @Post()      create(@Body() dto: CreateReservaDto)                                      { return this.service.create(dto) }
  @Patch(':id/estado') cambiarEstado(@Param('id') id: string, @Body() dto: UpdateEstadoReservaDto) { return this.service.cambiarEstado(id, dto) }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: Partial<CreateReservaDto>)  { return this.service.update(id, dto) }
  @Delete(':id') remove(@Param('id') id: string)                                         { return this.service.remove(id) }
}

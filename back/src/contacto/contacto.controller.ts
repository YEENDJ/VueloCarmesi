import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ContactoService } from './contacto.service'
import { CreateContactoDto } from './dto/create-contacto.dto'
import { UpdateEstadoContactoDto } from './dto/update-estado-contacto.dto'
import { AdminGuard } from '../common/guards/admin.guard'
import { LimiteFormularios } from '../common/limite-formularios'

/**
 * Solo el POST es público: es el formulario. Lo demás devuelve nombre, correo
 * y teléfono de quien escribió, así que va detrás del guard y el panel lo pide
 * por el puente de front/app/api/admin/.
 */
@Controller('contacto')
export class ContactoController {
  constructor(private readonly service: ContactoService) {}

  @Post()
  @LimiteFormularios()
  create(@Body() dto: CreateContactoDto) {
    return this.service.create(dto)
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.service.findAll()
  }

  @Patch(':id/estado')
  @UseGuards(AdminGuard)
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoContactoDto) {
    return this.service.updateEstado(id, dto.estado)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}

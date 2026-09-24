import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { SolicitudesGrupoService } from './solicitudes-grupo.service'
import { CreateSolicitudGrupoDto } from './dto/create-solicitud-grupo.dto'
import { UpdateEstadoSolicitudDto } from './dto/update-estado-solicitud.dto'
import { AdminGuard } from '../common/guards/admin.guard'
import { LimiteFormularios } from '../common/limite-formularios'

/**
 * Solo el POST es público: es el formulario. Todo lo demás lleva nombre,
 * teléfono, correo y NIT de quien escribió, así que va detrás del guard y el
 * panel lo pide por el puente de front/app/api/admin/.
 */
@Controller('solicitudes-grupo')
export class SolicitudesGrupoController {
  constructor(private readonly service: SolicitudesGrupoService) {}

  @Post()
  @LimiteFormularios()
  create(@Body() dto: CreateSolicitudGrupoDto) {
    return this.service.create(dto)
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.service.findAll()
  }

  @Patch(':id/estado')
  @UseGuards(AdminGuard)
  updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoSolicitudDto) {
    return this.service.updateEstado(id, dto.estado)
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}

import { Controller, Post, Body } from '@nestjs/common'
import { SolicitudesGrupoService } from './solicitudes-grupo.service'
import { CreateSolicitudGrupoDto } from './dto/create-solicitud-grupo.dto'

@Controller('solicitudes-grupo')
export class SolicitudesGrupoController {
  constructor(private readonly service: SolicitudesGrupoService) {}

  @Post()
  create(@Body() dto: CreateSolicitudGrupoDto) {
    return this.service.create(dto)
  }
}

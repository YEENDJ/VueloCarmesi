import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { AvesService } from './aves.service'
import { CreateAveDto } from './dto/create-ave.dto'
import { OrdenAvesDto, UpdateAveDto } from './dto/update-ave.dto'
import { idiomaValido } from '../traduccion/campos'

@Controller('aves')
export class AvesController {
  constructor(private readonly service: AvesService) {}

  // La lectura es la página pública de aviturismo; sin `idioma` es la del panel.
  @Get() findAll(@Query('idioma') idioma?: string) { return this.service.findAll(idioma ? idiomaValido(idioma) : undefined) }

  // `orden` antes que `:id`: si no, Nest lo tomaría por un id.
  @UseGuards(AdminGuard) @Patch('orden') reordenar(@Body() dto: OrdenAvesDto)                     { return this.service.reordenar(dto) }
  @UseGuards(AdminGuard) @Post()         create(@Body() dto: CreateAveDto)                         { return this.service.create(dto) }
  @UseGuards(AdminGuard) @Patch(':id')   update(@Param('id') id: string, @Body() dto: UpdateAveDto) { return this.service.update(id, dto) }
  @UseGuards(AdminGuard) @Delete(':id')  remove(@Param('id') id: string)                           { return this.service.remove(id) }
}

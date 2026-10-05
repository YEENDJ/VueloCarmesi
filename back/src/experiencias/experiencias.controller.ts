import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { ExperienciasService } from './experiencias.service'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'
import { UpdateExperienciaDto } from './dto/update-experiencia.dto'
import { idiomaValido } from '../traduccion/campos'

@Controller('experiencias')
export class ExperienciasController {
  constructor(private readonly service: ExperienciasService) {}

  // Las lecturas son la web pública. Crear, editar y borrar es del panel.
  //
  // `idioma` decide en qué lengua vuelve la ficha. Ausente = español, que es
  // el original: el panel y cualquier cliente viejo siguen funcionando igual.
  @Get()              findAll(@Query('destacadas') destacadas?: string, @Query('idioma') idioma?: string) { return this.service.findAll(destacadas === 'true', idiomaValido(idioma)) }
  @Get('slug/:slug')  findBySlug(@Param('slug') slug: string, @Query('idioma') idioma?: string)           { return this.service.findBySlug(slug, idiomaValido(idioma)) }
  @Get(':id')         findOne(@Param('id') id: string)                                 { return this.service.findById(id) }
  @UseGuards(AdminGuard) @Post()             create(@Body() dto: CreateExperienciaDto)                        { return this.service.create(dto) }
  @UseGuards(AdminGuard) @Patch(':id')       update(@Param('id') id: string, @Body() dto: UpdateExperienciaDto) { return this.service.update(id, dto) }
  @UseGuards(AdminGuard) @Delete(':id')      remove(@Param('id') id: string)                                  { return this.service.remove(id) }
}

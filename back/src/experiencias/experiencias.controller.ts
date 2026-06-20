import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ExperienciasService } from './experiencias.service'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'

@Controller('experiencias')
export class ExperienciasController {
  constructor(private readonly service: ExperienciasService) {}

  @Get()              findAll()                                                         { return this.service.findAll() }
  @Get('slug/:slug')  findBySlug(@Param('slug') slug: string)                          { return this.service.findBySlug(slug) }
  @Get(':id')         findOne(@Param('id') id: string)                                 { return this.service.findById(id) }
  @Post()             create(@Body() dto: CreateExperienciaDto)                        { return this.service.create(dto) }
  @Patch(':id')       update(@Param('id') id: string, @Body() dto: Partial<CreateExperienciaDto>) { return this.service.update(id, dto) }
  @Delete(':id')      remove(@Param('id') id: string)                                  { return this.service.remove(id) }
}

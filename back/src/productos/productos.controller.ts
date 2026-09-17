import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ProductosService } from './productos.service'
import { CreateProductoDto } from './dto/create-producto.dto'
import { UpdateProductoDto } from './dto/update-producto.dto'
import { idiomaValido } from '../traduccion/campos'

@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()             findAll(@Query('idioma') idioma?: string)                                   { return this.service.findAll(idiomaValido(idioma)) }
  @Get('slug/:slug') findBySlug(@Param('slug') slug: string, @Query('idioma') idioma?: string)   { return this.service.findBySlug(slug, idiomaValido(idioma)) }
  @Get(':id')        findOne(@Param('id') id: string)                                            { return this.service.findById(id) }
  @Post()            create(@Body() dto: CreateProductoDto)                                      { return this.service.create(dto) }
  @Patch(':id')      update(@Param('id') id: string, @Body() dto: UpdateProductoDto)             { return this.service.update(id, dto) }
  @Delete(':id')     remove(@Param('id') id: string)                                             { return this.service.remove(id) }
}

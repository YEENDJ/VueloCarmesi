import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ProductosService } from './productos.service'
import { CreateProductoDto } from './dto/create-producto.dto'

@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()             findAll()                                                                    { return this.service.findAll() }
  @Get('slug/:slug') findBySlug(@Param('slug') slug: string)                                    { return this.service.findBySlug(slug) }
  @Get(':id')        findOne(@Param('id') id: string)                                            { return this.service.findById(id) }
  @Post()            create(@Body() dto: CreateProductoDto)                                      { return this.service.create(dto) }
  @Patch(':id')      update(@Param('id') id: string, @Body() dto: Partial<CreateProductoDto>)   { return this.service.update(id, dto) }
  @Delete(':id')     remove(@Param('id') id: string)                                             { return this.service.remove(id) }
}

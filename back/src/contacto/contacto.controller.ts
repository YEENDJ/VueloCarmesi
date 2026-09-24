import { Controller, Post, Body } from '@nestjs/common'
import { ContactoService } from './contacto.service'
import { CreateContactoDto } from './dto/create-contacto.dto'
import { LimiteFormularios } from '../common/limite-formularios'

@Controller('contacto')
export class ContactoController {
  constructor(private readonly service: ContactoService) {}

  @Post()
  @LimiteFormularios()
  create(@Body() dto: CreateContactoDto) {
    return this.service.create(dto)
  }
}

import { Controller, Post, Body } from '@nestjs/common'
import { ContactoService } from './contacto.service'
import { CreateContactoDto } from './dto/create-contacto.dto'

@Controller('contacto')
export class ContactoController {
  constructor(private readonly service: ContactoService) {}

  @Post()
  create(@Body() dto: CreateContactoDto) {
    return this.service.create(dto)
  }
}

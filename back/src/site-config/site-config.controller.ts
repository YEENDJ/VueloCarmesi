import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { SiteConfigService } from './site-config.service'
import { idiomaValido } from '../traduccion/campos'

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get()
  getAll(@Query('idioma') idioma?: string) {
    return this.service.getAll(idiomaValido(idioma))
  }

  /** Todo, con las claves privadas. Es lo que lee el panel. */
  @Get('admin')
  @UseGuards(AdminGuard)
  getAdmin() {
    return this.service.getAll(undefined, true)
  }

  @Patch()
  @UseGuards(AdminGuard)
  patch(@Body() data: Record<string, string>) {
    return this.service.patch(data)
  }
}

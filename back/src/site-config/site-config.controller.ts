import { Body, Controller, Get, Patch } from '@nestjs/common'
import { SiteConfigService } from './site-config.service'

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get()
  getAll() {
    return this.service.getAll()
  }

  @Patch()
  patch(@Body() data: Record<string, string>) {
    return this.service.patch(data)
  }
}

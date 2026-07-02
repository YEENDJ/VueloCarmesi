import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../common/guards/admin.guard'
import { SiteConfigService } from './site-config.service'

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get()
  getAll() {
    return this.service.getAll()
  }

  @Patch()
  @UseGuards(AdminGuard)
  patch(@Body() data: Record<string, string>) {
    return this.service.patch(data)
  }
}

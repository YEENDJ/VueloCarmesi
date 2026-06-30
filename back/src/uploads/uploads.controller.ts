import {
  Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { AdminGuard } from '../common/guards/admin.guard'
import { UploadsService } from './uploads.service'

@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('image')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Campo "file" requerido')
    return this.service.uploadImage(file)
  }
}

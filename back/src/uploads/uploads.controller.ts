import {
  Controller, Post, Delete, Body, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { AdminGuard } from '../common/guards/admin.guard'
import { UploadsService } from './uploads.service'
import { DeleteImageDto } from './dto/delete-image.dto'

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

  // La URL viaja en el cuerpo y no en la ruta: lleva barras y dos puntos, que
  // como parámetro habría que codificar dos veces para que no rompa el enrutado.
  @Delete('image')
  @UseGuards(AdminGuard)
  async deleteImage(@Body() dto: DeleteImageDto) {
    return this.service.deleteImage(dto.url)
  }
}

import { Module } from '@nestjs/common'
import { ProductosController } from './productos.controller'
import { ProductosService } from './productos.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [ProductosController],
  providers: [ProductosService, PrismaService],
})
export class ProductosModule {}

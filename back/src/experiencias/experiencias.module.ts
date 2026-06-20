import { Module } from '@nestjs/common'
import { ExperienciasController } from './experiencias.controller'
import { ExperienciasService } from './experiencias.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [ExperienciasController],
  providers: [ExperienciasService, PrismaService],
})
export class ExperienciasModule {}

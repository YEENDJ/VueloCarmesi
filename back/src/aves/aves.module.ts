import { Module } from '@nestjs/common'
import { AvesController } from './aves.controller'
import { AvesService } from './aves.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [AvesController],
  providers: [AvesService, PrismaService],
})
export class AvesModule {}

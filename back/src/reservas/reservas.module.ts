import { Module } from '@nestjs/common'
import { ReservasController } from './reservas.controller'
import { ReservasService } from './reservas.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [ReservasController],
  providers: [ReservasService, PrismaService],
})
export class ReservasModule {}

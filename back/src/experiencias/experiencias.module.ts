import { Module } from '@nestjs/common';
import { ExperienciasController } from './experiencias.controller';
import { ExperienciasService } from './experiencias.service';

@Module({
  controllers: [ExperienciasController],
  providers: [ExperienciasService]
})
export class ExperienciasModule {}

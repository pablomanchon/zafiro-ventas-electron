import { Module } from '@nestjs/common';
import { GastronomiaService } from './gastronomia.service';
import { GastronomiaController } from './gastronomia.controller';

@Module({
  controllers: [GastronomiaController],
  providers: [GastronomiaService],
})
export class GastronomiaModule {}

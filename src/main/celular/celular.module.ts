import { Module } from '@nestjs/common';
import { CelularService } from './celular.service';
import { CelularController } from './celular.controller';

@Module({
  controllers: [CelularController],
  providers: [CelularService],
})
export class CelularModule {}

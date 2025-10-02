import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';
import { Caja } from './entities/caja.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Caja])],
  providers: [CajaService],
  controllers: [CajaController],
  exports: [CajaService], // IMPORTANTE: para usar en VentasService
})
export class CajaModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';
import { Caja } from './entities/caja.entity';
import { CajaMoveDetail } from './entities/cajaMove.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Caja, CajaMoveDetail])],
  providers: [CajaService],
  controllers: [CajaController],
  exports: [CajaService], // IMPORTANTE: para usar en VentasService
})
export class CajaModule { }

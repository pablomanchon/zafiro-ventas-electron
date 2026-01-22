import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';
import { Horario } from './entities/horario.entity';
import { Vendedor } from '../vendedores/entities/vendedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Horario, Vendedor])],
  controllers: [HorariosController],
  providers: [HorariosService],
  exports: [TypeOrmModule], // opcional
})
export class HorariosModule {}

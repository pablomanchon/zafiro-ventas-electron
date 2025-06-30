// src/prueba/prueba.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';        // <-- importa TypeOrmModule
import { Prueba } from './entities/prueba.entity';      // <-- importa tu entidad
import { PruebaService } from './prueba.service';
import { PruebaController } from './prueba.controller';
import { PruebaRepository } from './prueba.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prueba]),               // <-- añade aquí
  ],
  controllers: [PruebaController],
  providers: [PruebaService, PruebaRepository],
})
export class PruebaModule {}

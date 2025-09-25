// src/clientes/clientes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente]),  // entidad Cliente
  ],
  controllers: [ClientesController],
  providers: [ClientesService],          // provee el servicio
  exports: [ClientesService],            // ← exporta el servicio
})
export class ClientesModule {}

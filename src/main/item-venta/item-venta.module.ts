// src/item-venta/item-venta.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ItemVentaService } from './item-venta.service';
import { ItemVenta } from './entities/item-venta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemVenta]),  // 1) entidad
  ],
  providers: [
    ItemVentaService,                       // 2) servicio
  ],
  exports: [
    ItemVentaService,                       // 3) lo exportas
  ],
})
export class ItemVentaModule {}

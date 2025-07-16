// src/venta-detalle/venta-detalle.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VentaDetalleService } from './venta-detalle.service';
import { VentaDetalleController } from './venta-detalle.controller';
import { VentaDetalle } from './entities/venta-detalle.entity';

import { ItemVentaModule } from '../item-venta/item-venta.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VentaDetalle]), // sólo la entidad propia
    ItemVentaModule,                          // importamos el módulo que exporta ItemVentaService
  ],
  controllers: [VentaDetalleController],
  providers: [VentaDetalleService],
  exports: [VentaDetalleService],             // si otros módulos van a inyectarlo
})
export class VentaDetalleModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaDetalleService } from './venta-detalle.service';
import { VentaDetalleController } from './venta-detalle.controller';
import { VentaDetalle } from './entities/venta-detalle.entity';
import { ItemVenta } from '../item-venta/entities/item-venta.entity';
import { Producto } from '../productos/entities/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VentaDetalle, ItemVenta, Producto])],
  controllers: [VentaDetalleController],
  providers: [VentaDetalleService],
})
export class VentaDetalleModule {}

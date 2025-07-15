import { Module } from '@nestjs/common';
import { VentaDetalleService } from './venta-detalle.service';
import { VentaDetalleController } from './venta-detalle.controller';

@Module({
  controllers: [VentaDetalleController],
  providers: [VentaDetalleService],
})
export class VentaDetalleModule {}

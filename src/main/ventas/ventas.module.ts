import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { Venta } from './entities/venta.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Producto } from '../productos/entities/producto.entity';
import { ItemVenta } from '../item-venta/entities/item-venta.entity';
import { VentaDetalle } from '../venta-detalle/entities/venta-detalle.entity';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';
import { VentaPago } from '../venta-pagos/entities/venta-pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      Cliente,
      Producto,
      ItemVenta,
      VentaDetalle,
      MetodoPago,
      VentaPago,
    ]),
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}

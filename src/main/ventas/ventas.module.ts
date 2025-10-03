// src/ventas/ventas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { Venta } from './entities/venta.entity';

import { ClientesModule } from '../clientes/clientes.module';
import { ProductosModule } from '../productos/productos.module';
import { ItemVentaModule } from '../item-venta/item-venta.module';
import { VentaDetalleModule } from '../venta-detalle/venta-detalle.module';
import { VentaPagosModule } from '../venta-pagos/venta-pagos.module';
import { MetodoPagoModule } from '../metodo-pago/metodo-pago.module';
import { VentaPagosService } from '../venta-pagos/venta-pagos.service';
import { VentaPago } from '../venta-pagos/entities/venta-pago.entity';
import { CajaModule } from '../caja/caja.module';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';
import { VendedoresModule } from '../vendedores/vendedores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, VentaPago, MetodoPago]),
    ClientesModule,
    ProductosModule,
    ItemVentaModule,
    VentaDetalleModule,
    VentaPagosModule,
    CajaModule,
    VendedoresModule
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule { }

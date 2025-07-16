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

@Module({
  imports: [
    // Sólo la entidad principal
    TypeOrmModule.forFeature([Venta]),

    // Importa todos los módulos cuyos servicios inyectas en VentasService
    ClientesModule,
    ProductosModule,
    ItemVentaModule,
    VentaDetalleModule,
    VentaPagosModule,
    MetodoPagoModule,
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}

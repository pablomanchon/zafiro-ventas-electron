import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ProductosModule } from './productos/productos.module';
import { ClientesModule } from './clientes/clientes.module';
import { VentasModule } from './ventas/ventas.module';
import { VentaDetalleModule } from './venta-detalle/venta-detalle.module';
import { ItemVentaModule } from './item-venta/item-venta.module';
import { MetodoPagoModule } from './metodo-pago/metodo-pago.module';
import { VentaPagosModule } from './venta-pagos/venta-pagos.module';
import { FacturasModule } from './facturas/facturas.module';
import { GastronomiaModule } from './gastronomia/gastronomia.module';
import { CajaModule } from './caja/caja.module';
import { VendedoresModule } from './vendedores/vendedores.module';
import { MovimientoStockModule } from './movimiento-stock/movimiento-stock.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,      // en dev sincroniza esquema
      autoLoadEntities: true, // carga entities de cada módulo
      logging:['error','query','schema'],
      logger: 'advanced-console'
    }),
    ProductosModule,
    ClientesModule,
    VentasModule,
    VentaDetalleModule,
    ItemVentaModule,
    MetodoPagoModule,
    VentaPagosModule,
    FacturasModule,
    GastronomiaModule,
    CajaModule,
    VendedoresModule,
    MovimientoStockModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

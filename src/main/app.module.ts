import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { ProductosModule } from './productos/productos.module';
import { ClientesModule } from './clientes/clientes.module';
import { VentasModule } from './ventas/ventas.module';
import { VentaDetalleModule } from './venta-detalle/venta-detalle.module';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { ItemVentaModule } from './item-venta/item-venta.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,      // en dev sincroniza esquema
      autoLoadEntities: true, // carga entities de cada módulo
    }),
    ProductosModule,
    ClientesModule,
    VentasModule,
    VentaDetalleModule,
    MetodosPagoModule,
    ItemVentaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

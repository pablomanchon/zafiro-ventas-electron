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
import { UserModule } from './user/user.module';
import { SupabaseAuthGuard } from './guards/supabase-guard.auth';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mssql',
        host: 'localhost',
        port: 1433,
        username: process.env.MSUSER ?? 'zafiro_user',
        password: process.env.MSPASSWORD ?? '1234',
        database: process.env.MSDB ?? 'ZafiroDB',
        autoLoadEntities: true,
        synchronize: true,
        logging: ['error', 'warn'],
        extra: { max: 5, idleTimeoutMillis: 30000 },
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
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
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseAuthGuard],
})
export class AppModule { }

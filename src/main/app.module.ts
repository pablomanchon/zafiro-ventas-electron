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
import { HorariosModule } from './horarios/horarios.module';
import path from 'path';
import fs from 'fs';
import { ImporterModule } from './importer/importer.module';
import { HealthController } from './healt.controller';

function buildTypeOrmConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    return {
      type: 'postgres' as const,
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      logging: ['error', 'warn'],
      ssl: { rejectUnauthorized: false },
    };
  }

  const dbPath =
    process.env.ZAFIRO_DB_PATH ||
    path.join(process.cwd(), 'zafiro.sqlite');

  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch {}

  return {
    type: 'sqlite' as const,
    database: dbPath,
    autoLoadEntities: true,
    synchronize: true,
    logging: ['error', 'warn'],
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: buildTypeOrmConfig,
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
    UserModule,
    HorariosModule,
    ImporterModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}

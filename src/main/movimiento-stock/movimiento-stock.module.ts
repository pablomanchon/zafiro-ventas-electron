import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoStockService } from './movimiento-stock.service';
import { MovimientoStockController } from './movimiento-stock.controller';
import { ProductosModule } from '../productos/productos.module';
import { MovimientoStock } from './entities/movimiento-stock.entity';
import { Producto } from '../productos/entities/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovimientoStock, Producto]), // 👈 entidades registradas
    ProductosModule, // para inyectar ProductosService si lo necesitás
  ],
  controllers: [MovimientoStockController],
  providers: [MovimientoStockService],
  exports: [MovimientoStockService],
})
export class MovimientoStockModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemVentaService } from './item-venta.service';
import { ItemVentaController } from './item-venta.controller';
import { ItemVenta } from './entities/item-venta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemVenta])],
  controllers: [ItemVentaController],
  providers: [ItemVentaService],
})
export class ItemVentaModule {}

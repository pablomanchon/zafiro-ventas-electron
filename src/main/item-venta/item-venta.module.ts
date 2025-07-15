import { Module } from '@nestjs/common';
import { ItemVentaService } from './item-venta.service';
import { ItemVentaController } from './item-venta.controller';

@Module({
  controllers: [ItemVentaController],
  providers: [ItemVentaService],
})
export class ItemVentaModule {}

import { Module } from '@nestjs/common';
import { VentaPagosService } from './venta-pagos.service';
import { VentaPagosController } from './venta-pagos.controller';

@Module({
  controllers: [VentaPagosController],
  providers: [VentaPagosService],
})
export class VentaPagosModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaPagosService } from './venta-pagos.service';
import { VentaPagosController } from './venta-pagos.controller';
import { VentaPago } from './entities/venta-pago.entity';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VentaPago, MetodoPago])],
  controllers: [VentaPagosController],
  providers: [VentaPagosService],
  exports: [VentaPagosService]
})
export class VentaPagosModule {}

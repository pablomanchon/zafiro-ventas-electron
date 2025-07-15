import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentaPagosService } from './venta-pagos.service';
import { VentaPagosController } from './venta-pagos.controller';
import { VentaPago } from './entities/venta-pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VentaPago])],
  controllers: [VentaPagosController],
  providers: [VentaPagosService],
})
export class VentaPagosModule {}

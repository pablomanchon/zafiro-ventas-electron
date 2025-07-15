import { Module } from '@nestjs/common';
import { MetodoPagoService } from './metodo-pago.service';
import { MetodoPagoController } from './metodo-pago.controller';

@Module({
  controllers: [MetodoPagoController],
  providers: [MetodoPagoService],
})
export class MetodoPagoModule {}

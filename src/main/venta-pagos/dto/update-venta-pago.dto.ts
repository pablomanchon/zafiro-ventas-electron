import { PartialType } from '@nestjs/mapped-types';
import { CreateVentaPagoDto } from './create-venta-pago.dto';

export class UpdateVentaPagoDto extends PartialType(CreateVentaPagoDto) {}

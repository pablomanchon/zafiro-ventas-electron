import { PartialType } from '@nestjs/mapped-types';
import { CreateMetodosPagoDto } from './create-metodos-pago.dto';

export class UpdateMetodosPagoDto extends PartialType(CreateMetodosPagoDto) {}

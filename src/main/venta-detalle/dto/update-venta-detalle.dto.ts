import { PartialType } from '@nestjs/mapped-types';
import { CreateVentaDetalleDto } from './create-venta-detalle.dto';

export class UpdateVentaDetalleDto extends PartialType(CreateVentaDetalleDto) {}

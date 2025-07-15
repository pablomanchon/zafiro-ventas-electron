import { PartialType } from '@nestjs/mapped-types';
import { CreateItemVentaDto } from './create-item-venta.dto';

export class UpdateItemVentaDto extends PartialType(CreateItemVentaDto) {}

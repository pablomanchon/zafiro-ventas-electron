import { PartialType } from '@nestjs/mapped-types';
import { ProductoDto } from './create-producto.dto';

export class UpdateProductoDto extends PartialType(ProductoDto) {}

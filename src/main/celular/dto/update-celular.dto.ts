import { PartialType } from '@nestjs/mapped-types';
import { CreateCelularDto } from './create-celular.dto';

export class UpdateCelularDto extends PartialType(CreateCelularDto) {}

import { ProductoDto } from '../../productos/dto/create-producto.dto';

export class PlatoIngredienteInput {
  ingredienteId!: string;
  cantidadUsada!: number;
}

export class PlatoSubplatoInput {
  platoHijoId!: string;
  cantidadUsada!: number;
}

export class CreatePlatoDto extends ProductoDto {
  ingredientes?: PlatoIngredienteInput[];
  subplatos?: PlatoSubplatoInput[];
}

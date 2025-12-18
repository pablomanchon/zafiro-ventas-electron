import { ProductoDto } from '../../productos/dto/create-producto.dto';

export class PlatoIngredienteInput {
  ingredienteId!: number;
  cantidadUsada!: number;
}

export class PlatoSubplatoInput {
  platoHijoId!: number;
  cantidadUsada!: number;
}

export class CreatePlatoDto extends ProductoDto {
  ingredientes?: PlatoIngredienteInput[];
  subplatos?: PlatoSubplatoInput[];
}

import { UnidadMedidaIngrediente } from '../entities/ingrediente.entity';

export class CreateIngredienteDto {
  nombre!: string;
  unidadBase!: UnidadMedidaIngrediente;
  cantidadBase!: number;
  precioCostoBase!: number;
}

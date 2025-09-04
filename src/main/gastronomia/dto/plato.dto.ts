import { ProductoDto } from "../../productos/dto/create-producto.dto";
import { UnidadMedida } from "../entities/ingrediente.entity";

export class PlatoDto extends ProductoDto {
    ingredientes : PlatoIngredienteDto[];
}

export class PlatoIngredienteDto {
    ingredienteId: number;
    cantidad: number;
    unidad: UnidadMedida;
}

export class IngredienteDto {
    nombre:string;
    unidad:number;
    precio:number;
    cantidad:number;
}
export interface PlatoIngredienteInput {
    id: string;
    ingrediente:IngredienteDto;
    cantidadUsada: number;
}

export interface IngredienteDto {
    nombre: string;
    cantidadBase: number;
    unidadBase: number;
    precioCostoBase: number;
}

export class PlatoSubplatoInput {
    platoHijoId!: string;
    cantidadUsada!: number;
}

export interface PlatoDto extends CreatePlatoDto{

}

export interface CreatePlatoDto {
    id: string;
    nombre: string;
    descripcion?: string;
    precio: number;
    stock: number;
    ingredientes: PlatoIngredienteInput[];
    subplatos?: PlatoSubplatoInput[];
}
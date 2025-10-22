import { MovimientoStock } from "../entities/movimiento-stock.entity";

export class CreateMovimientoStockDto {
    moveType: 'in' | 'out'
    products: ProductMoveStock[]
}

export type ProductMoveStock = {
    idProduct: string;
    quantity: number;
}

export function toDto(entity: MovimientoStock): CreateMovimientoStockDto {
    return {
        moveType: 'in', // no se guarda, pero podés devolver el tipo según tu lógica
        products: entity.productsMoveStock,
    };
}
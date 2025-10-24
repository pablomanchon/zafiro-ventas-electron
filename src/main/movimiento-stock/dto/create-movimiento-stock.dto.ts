import { MovimientoStock } from "../entities/movimiento-stock.entity";

export class CreateMovimientoStockDto {
    moveType: 'in' | 'out'
    products: ProductMoveStock[]
}

export type ProductMoveStock = {
    idProduct: string;
    quantity: number;
}

export class MovimientoStockDto extends CreateMovimientoStockDto {
    id: number
}

export function toDto(entity: MovimientoStock): CreateMovimientoStockDto {
    return {
        moveType: entity.moveType,
        products: entity.productsMoveStock,
    };
}
import { CajaMoveDetail } from "../entities/cajaMove.entity";

export class CajaMoveDto {
    id: number;
    saldoPesos: string;
    saldoUSD: string;
    moveType: 'in' | 'out';
    createdAt: Date;
    updatedAt: Date;
}

export class CajaMoveDetailDto {
    id: number;
    monto: string;
    moneda: 'pesos' | 'usd';
    moveType: 'in' | 'out'
    createdAt: Date;
    updatedAt: Date;
}
export function toDto(entity: CajaMoveDetail) {
    return {
        id: entity.id,
        saldoPesos: entity.saldoPesos,
        saldoUSD: entity.saldoUSD,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        moveType: entity.moveType
    } as CajaMoveDto;
}
export function toMoveDetailDto(entity: CajaMoveDetail, moneda: 'pesos' | 'usd') {
    return {
        id: entity.id,
        moneda: moneda,
        monto: moneda === 'pesos' ? entity.saldoPesos : entity.saldoUSD,
        moveType: entity.moveType,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt
    } as CajaMoveDetailDto
}

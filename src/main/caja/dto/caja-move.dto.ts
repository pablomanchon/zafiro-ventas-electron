import { CajaMoveDetail } from "../entities/cajaMove.entity";

export class cajaMoveDto {
    id: string;
    saldoPesos: string;
    saldoUSD: string;
}
export function toDto(entity: CajaMoveDetail) {
    return {
        id: entity.id,
        saldoPesos: Number(entity.saldoPesos),
        saldoUSD: Number(entity.saldoUSD),
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
}

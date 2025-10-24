import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CajaMoveDto } from '../dto/caja-move.dto';

@Entity({ name: 'cajaMoveDetail' })
export class CajaMoveDetail {
  @PrimaryGeneratedColumn()
  id: number;

  // Saldo en pesos argentinos
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  saldoPesos: string;

  // Saldo en dólares
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  saldoUSD: string;

  @Column()
  moveType: 'in' | 'out';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
export function toEntity(dto: CajaMoveDto): CajaMoveDetail {
  const entity = new CajaMoveDetail();
  entity.saldoPesos = dto.saldoPesos;
  entity.saldoUSD = dto.saldoUSD;
  return entity;
}

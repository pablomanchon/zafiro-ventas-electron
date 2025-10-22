import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { cajaMoveDto } from '../dto/caja-move.dto';

@Entity({ name: 'caja' })
export class CajaMoveDetail {
  @PrimaryGeneratedColumn()
  id: number;

  // Saldo en pesos argentinos
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  saldoPesos: string;

  // Saldo en dólares
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  saldoUSD: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
export function toEntity(dto: cajaMoveDto): CajaMoveDetail {
  const entity = new CajaMoveDetail();
  entity.saldoPesos = dto.saldoPesos;
  entity.saldoUSD = dto.saldoUSD;
  return entity;
}

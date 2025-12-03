// src/caja/caja.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CajaMoveDetail } from './cajaMove.entity';
import { CajaMoveDto } from '../dto/caja-move.dto';

@Entity({ name: 'caja' })
export class Caja {
  @PrimaryColumn()
  id: string = 'main';

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

export function toEntity(dto: CajaMoveDto): CajaMoveDetail {
  const entity = new CajaMoveDetail();

  // Asignamos los valores que llegan desde el DTO
  entity.saldoPesos = dto.saldoPesos;
  entity.saldoUSD = dto.saldoUSD;

  // createdAt y updatedAt se llenan solos por TypeORM
  return entity;
}
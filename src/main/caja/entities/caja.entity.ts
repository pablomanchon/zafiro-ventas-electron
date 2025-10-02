// src/caja/caja.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'caja' })
export class Caja {
  @PrimaryColumn({ type: 'text' })
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

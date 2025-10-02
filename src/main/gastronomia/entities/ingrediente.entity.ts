// ingredientes/entities/ingrediente.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UnidadMedida { U = 'u', GR = 'gr', KG = 'kg', ML = 'ml', L = 'l' }

@Entity('ingredientes')
export class Ingrediente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  // Cómo se compra:
  @Column({ type: 'varchar' })
  unidadCompra!: UnidadMedida;          // U (unidad), GR, ML, etc.

  @Column('decimal', { precision: 10, scale: 3 })
  cantidadPorPaquete!: number;          // p.ej. 6

  @Column('decimal', { precision: 10, scale: 2 })
  precioPaquete!: number;               // p.ej. 2000.00
}

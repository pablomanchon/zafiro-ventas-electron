// src/productos/entities/producto.entity.ts
import { Entity, PrimaryColumn, Column, TableInheritance, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } }) // discriminador
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { name: 'stock_minimo', default: 0 })
  stockMinimo: number;

  @Column({ default: false })
  deleted: boolean;
}

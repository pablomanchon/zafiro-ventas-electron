// src/productos/entities/producto.entity.ts
import { Entity, PrimaryColumn, Column, TableInheritance } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'tipo' } }) // discriminador
export class Producto {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('int')
  stock: number;

}

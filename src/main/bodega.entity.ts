import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ZonaBodega } from './zona-bodega.entity';

@Entity('bodegas')
export class Bodega {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column('text')
  ubicacion: string;

  @Column('float')
  capacidadTotalL: number;

  @OneToMany(() => ZonaBodega, zona => zona.bodega)
  zonas: ZonaBodega[];
}
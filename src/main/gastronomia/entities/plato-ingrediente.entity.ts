// platos/entities/plato-ingrediente.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique } from 'typeorm';
import { Ingrediente, UnidadMedida } from './ingrediente.entity';
import { Plato } from './plato.entity';

@Entity('platos_ingredientes')
@Unique('UQ_plato_ingrediente', ['plato', 'ingrediente'])
export class PlatoIngrediente {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Plato, p => p.ingredientes, { onDelete: 'CASCADE' })
  plato!: Plato;

  @ManyToOne(() => Ingrediente, { eager: true, onDelete: 'RESTRICT' })
  ingrediente!: Ingrediente;

  @Column('decimal', { precision: 12, scale: 3 })
  cantidad!: number;                

  @Column({ type: 'varchar' })
  unidad!: UnidadMedida;               
}

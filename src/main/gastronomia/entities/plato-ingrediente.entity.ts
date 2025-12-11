// platos/entities/plato-ingrediente.entity.ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Ingrediente } from './ingrediente.entity';
import { Plato } from './plato.entity';

@Entity('platos_ingredientes')
@Unique('UQ_plato_ingrediente', ['plato', 'ingrediente'])
export class PlatoIngrediente {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Plato, p => p.ingredientes, { onDelete: 'CASCADE' })
  plato!: Plato;

  @ManyToOne(() => Ingrediente, { eager: true, onDelete: 'NO ACTION' })
  ingrediente!: Ingrediente;

  // cantidad usada en la misma unidadBase del Ingrediente
  @Column('decimal', { precision: 12, scale: 3 })
  cantidadUsada!: number;
}

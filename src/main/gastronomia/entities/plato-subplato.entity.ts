import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Plato } from './plato.entity';

@Entity('platos_subplatos')
@Unique('UQ_plato_subplato', ['platoPadre', 'platoHijo'])
export class PlatoSubplato {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Plato, p => p.subplatos, { onDelete: 'CASCADE' })
  platoPadre!: Plato;

  @ManyToOne(() => Plato, p => p.usadoEn, { onDelete: 'RESTRICT' })
  platoHijo!: Plato;

  // cantidad de subplatos usados
  @Column('decimal', { precision: 12, scale: 3 })
  cantidadUsada!: number;
}

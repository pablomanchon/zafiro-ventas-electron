// productos/entities/plato.entity.ts
import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';
import { PlatoIngrediente } from './plato-ingrediente.entity';
import { PlatoSubplato } from './plato-subplato.entity';

@ChildEntity('PLATO')
export class Plato extends Producto {
  // Costo total calculado (ingredientes + subplatos)
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  precioCosto!: number;

  @OneToMany(() => PlatoIngrediente, pi => pi.plato, { cascade: true, eager: true })
  ingredientes!: PlatoIngrediente[];

  @OneToMany(() => PlatoSubplato, sp => sp.platoPadre, { cascade: true, eager: true })
  subplatos!: PlatoSubplato[];

  // Permite navegar quién reutiliza este plato como subplato
  @OneToMany(() => PlatoSubplato, sp => sp.platoHijo, { cascade: true, eager: true })
  usadoEn!: PlatoSubplato[];
}

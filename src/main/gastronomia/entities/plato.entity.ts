// productos/entities/plato.entity.ts
import { ChildEntity, OneToMany } from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';
import { PlatoIngrediente } from './plato-ingrediente.entity';

@ChildEntity('PLATO')
export class Plato extends Producto {
  @OneToMany(() => PlatoIngrediente, pi => pi.plato, { cascade: true, eager: true })
  ingredientes!: PlatoIngrediente[];
}

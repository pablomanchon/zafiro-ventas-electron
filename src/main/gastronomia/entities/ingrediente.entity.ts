import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UnidadMedidaIngrediente {
  UNIDAD = 'UNIDAD',
  GRAMOS = 'GRAMOS',
  MILILITROS = 'MILILITROS',
}

export const isGoodMedida = (uMedida: string) => {
  return uMedida === UnidadMedidaIngrediente.GRAMOS || uMedida === UnidadMedidaIngrediente.MILILITROS || uMedida === UnidadMedidaIngrediente.UNIDAD
}

// Se opta por UUID para evitar colisiones al compartir catálogos entre locales y porque no
// se espera que Ingrediente participe en cálculos de stock (solo en recetas y costos).
@Entity('ingredientes')
export class Ingrediente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar' })
  unidadBase!: UnidadMedidaIngrediente;

  // Cantidad estándar a la que se refiere el precio de costo (p.ej. 1 unidad, 1000 gr, 1000 ml)
  @Column('decimal', { precision: 12, scale: 3 })
  cantidadBase!: number;

  @Column({ unique: true })
  codigo: string;

  // Costo por la cantidadBase
  @Column('decimal', { precision: 12, scale: 2 })
  precioCostoBase!: number;
  
  @Column({ default: false })
  deleted: boolean;
}

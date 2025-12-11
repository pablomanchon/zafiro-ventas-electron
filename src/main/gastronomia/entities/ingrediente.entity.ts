import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UnidadMedidaIngrediente {
  UNIDAD = 'UNIDAD',
  GRAMOS = 'GRAMOS',
  MILILITROS = 'MILILITROS',
}

// Se opta por UUID para evitar colisiones al compartir catálogos entre locales y porque no
// se espera que Ingrediente participe en cálculos de stock (solo en recetas y costos).
@Entity('ingredientes')
export class Ingrediente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar' })
  unidadBase!: UnidadMedidaIngrediente;

  // Cantidad estándar a la que se refiere el precio de costo (p.ej. 1 unidad, 1000 gr, 1000 ml)
  @Column('decimal', { precision: 12, scale: 3 })
  cantidadBase!: number;

  // Costo por la cantidadBase
  @Column('decimal', { precision: 12, scale: 2 })
  precioCostoBase!: number;
}

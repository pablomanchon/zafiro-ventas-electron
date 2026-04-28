import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CreateMovimientoStockDto, ProductMoveStock } from "../dto/create-movimiento-stock.dto";

@Entity()
export class MovimientoStock {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('simple-json')
  productsMoveStock: ProductMoveStock[]
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date
  @Column()
  moveType: 'in' | 'out'
  @Column({ nullable: true, type: 'text', default: null })
  detalle: string | null;
  @Column({ default: false })
  deleted: boolean;
}
export function toEntity(dto: CreateMovimientoStockDto): MovimientoStock {
  const entity = new MovimientoStock();
  entity.productsMoveStock = dto.products;
  entity.moveType = dto.moveType;
  entity.detalle = dto.detalle ?? null;

  return entity;
}
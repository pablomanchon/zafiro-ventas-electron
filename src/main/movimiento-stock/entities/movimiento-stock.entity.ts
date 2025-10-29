import { Column, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { CreateMovimientoStockDto, ProductMoveStock } from "../dto/create-movimiento-stock.dto";

export class MovimientoStock {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  productsMoveStock: ProductMoveStock[]
  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date
  @Column()
  moveType: 'in' | 'out'
}
export function toEntity(dto: CreateMovimientoStockDto): MovimientoStock {
  const entity = new MovimientoStock();
  entity.productsMoveStock = dto.products;
  entity.moveType = dto.moveType;

  return entity;
}
import { Column, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { CreateMovimientoStockDto, ProductMoveStock } from "../dto/create-movimiento-stock.dto";

export class MovimientoStock {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    productsMoveStock: ProductMoveStock[]
    @CreateDateColumn()
    fecha: Date
}
export function toEntity(dto: CreateMovimientoStockDto): MovimientoStock {
  const entity = new MovimientoStock();

  // guardamos el snapshot de productos
  entity.productsMoveStock = dto.products;

  // fecha la setea automáticamente el @CreateDateColumn
  return entity;
}
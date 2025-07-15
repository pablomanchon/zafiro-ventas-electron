// src/venta-detalle/entities/venta-detalle.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Venta } from '../../ventas/entities/venta.entity';
import { ItemVenta } from '../../item-venta/entities/item-venta.entity';

@Entity()
export class VentaDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venta, venta => venta.detalles)
  venta: Venta;

  @ManyToOne(() => ItemVenta, { cascade: true, eager: true })
  item: ItemVenta;

  @Column('int')
  cantidad: number;
}

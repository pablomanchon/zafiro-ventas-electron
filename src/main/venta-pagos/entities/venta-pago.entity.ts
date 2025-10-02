// src/ventas/entities/venta-pago.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Venta } from '../../ventas/entities/venta.entity';
import { MetodoPago } from '../../metodo-pago/entities/metodo-pago.entity';

@Entity()
export class VentaPago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venta, venta => venta.pagos)
  venta: Venta;

  @ManyToOne(() => MetodoPago, { eager: true, nullable: false })
  metodo: MetodoPago;

  @Column('decimal', { precision: 10, scale: 2 })
  monto: number;

  @Column('int', { nullable: true })
  cuotas?: number;
}

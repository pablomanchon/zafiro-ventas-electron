// src/ventas/entities/venta.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { VentaDetalle } from '../../venta-detalle/entities/venta-detalle.entity';
import { VentaPago } from '../../venta-pagos/entities/venta-pago.entity';

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @ManyToOne(() => Cliente, cliente => cliente.ventas, { eager: true })
  cliente: Cliente;

  @OneToMany(() => VentaDetalle, det => det.venta, {
    cascade: true,
    eager: true,
  })
  detalles: VentaDetalle[];

  @OneToMany(() => VentaPago, pago => pago.venta, {
    cascade: true,
    eager: true,
  })
  pagos: VentaPago[];
}

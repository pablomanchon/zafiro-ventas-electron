import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  AfterLoad,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { VentaDetalle } from '../../venta-detalle/entities/venta-detalle.entity';
import { VentaPago } from '../../venta-pagos/entities/venta-pago.entity';

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @ManyToOne(() => Cliente, cliente => cliente.ventas, { eager: true })
  cliente: Cliente;

  @OneToMany(() => VentaDetalle, detalle => detalle.venta, {
    cascade: true,
    eager: true,
  })
  detalles: VentaDetalle[];

  @OneToMany(() => VentaPago, pago => pago.venta, {
    cascade: true,
    eager: true,
  })
  pagos: VentaPago[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @AfterLoad()
  computeTotal(): void {
    this.total = this.detalles.reduce(
      (sum, det) => sum + Number(det.item.precio) * det.item.cantidad,
      0,
    );
  }
}

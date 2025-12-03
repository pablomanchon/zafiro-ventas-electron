import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  AfterLoad,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { VentaDetalle } from '../../venta-detalle/entities/venta-detalle.entity';
import { VentaPago } from '../../venta-pagos/entities/venta-pago.entity';
import { Vendedor } from '../../vendedores/entities/vendedor.entity';

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
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

  @ManyToOne(() => Vendedor, v => v.ventas, { eager: true, nullable: true, onDelete: 'SET NULL' })
  vendedor: Vendedor | null;

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

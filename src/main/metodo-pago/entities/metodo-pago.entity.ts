// src/metodos-pago/entities/metodo-pago.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class MetodoPago {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  nombre: string;

  @Column()
  tipo: 'debito' | 'credito';

}

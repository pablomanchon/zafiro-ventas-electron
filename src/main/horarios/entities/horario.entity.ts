import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Vendedor } from "../../vendedores/entities/vendedor.entity";

@Entity()
export class Horario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  horaIngreso: Date;

  @Column({ type: "datetime", nullable: true, default: () => "CURRENT_TIMESTAMP" })
  horaEgreso: Date | null;

  @ManyToOne(() => Vendedor, (vendedor) => vendedor.horarios, { eager: true, nullable: true })
  vendedor: Vendedor | null;
}

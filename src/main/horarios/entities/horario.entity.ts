import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Vendedor } from "../../vendedores/entities/vendedor.entity";

@Entity()
export class Horario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    horaIngreso: Date;

    @Column({ default: () => 'CURRENT_TIMESTAMP',nullable:true })
    horaEgreso?: Date | null;

    @ManyToOne(() => Vendedor, vendedor => vendedor.horarios, { eager: true, nullable:true })
    vendedor?: Vendedor;
}

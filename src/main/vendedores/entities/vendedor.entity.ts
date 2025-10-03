import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Venta } from "../../ventas/entities/venta.entity";

@Entity()
export class Vendedor {
    @PrimaryColumn()
    id: number

    @Column()
    nombre: string

    @OneToMany(() => Venta, venta => venta.vendedor)
    ventas: Venta[];
}

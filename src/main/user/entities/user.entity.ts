import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string
    @Column()
    name: string
    @Column({ unique: true })
    email: string
    @Column({ unique: true })
    auth_id: string;
    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    paymenthDate: Date
    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    vencDate: Date

    @Column({ type: 'bit', default: false })
    deleted: boolean;
}

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
    @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
    paymenthDate: Date
    @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
    vencDate: Date
}

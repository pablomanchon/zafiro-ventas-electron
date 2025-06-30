import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Prueba {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  campo: string;

  @Column()
  isDeleted: boolean;
}


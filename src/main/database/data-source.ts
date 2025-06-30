import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Producto } from './entities/Producto';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'app-data.sqlite',
  synchronize: true,
  logging: false,
  entities: [Producto],
});

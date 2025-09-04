import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { ProductoDto } from './dto/create-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly repo: Repository<Producto>,
  ) { }

  async findAll(manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    return repo.find();
  }

  async create(createDto: ProductoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const entity = repo.create(createDto);
    return repo.save(entity);
  }

  async findOne(id: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: string, updateDto: UpdateProductoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    await repo.update(id, updateDto);
    return repo.findOne({ where: { id } });
  }

  async remove(id: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    await repo.delete(id);
    return { deleted: true };
  }

  async decrementStock(
    productoId: string,
    cantidad: number,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const producto = await repo.findOne({ where: { id: productoId } });
    if (!producto) throw new Error('Producto no encontrado');
    if (producto.stock < cantidad) throw new Error('Stock insuficiente');

    producto.stock -= cantidad;
    return repo.save(producto);
  }
}
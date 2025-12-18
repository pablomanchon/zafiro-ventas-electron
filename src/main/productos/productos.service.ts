// src/productos/productos.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { ProductoDto } from './dto/create-producto.dto';
import { emitChange } from '../broadcast/event-bus'; // 👈
import { Column, getFromXlsx } from './utils';

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
    const data = await repo.findOne({ where: { id: createDto.id } });
    if (data) throw new BadRequestException("Ya existe un producto con esa id")
    const entity = repo.create(createDto);
    const saved = await repo.save(entity);
    // 🔔 notificar alta
    emitChange('productos:changed', { type: 'upsert', data: saved });
    return saved;
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateProductoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    await repo.update(id, updateDto);
    const updated = await repo.findOne({ where: { id } });
    if (updated) emitChange('productos:changed', { type: 'upsert', data: updated }); // 🔔
    return updated;
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    await repo.delete(id);
    // 🔔 notificar baja
    emitChange('productos:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }

  async decrementStock(productoId: number, cantidad: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const producto = await repo.findOne({ where: { id: productoId } });
    if (!producto) throw new Error('Producto no encontrado');
    if (producto.stock < cantidad) throw new Error('Stock insuficiente');

    producto.stock -= cantidad;
    const saved = await repo.save(producto);
    // 🔔 notificar cambio de stock
    emitChange('productos:changed', { type: 'upsert', data: saved });
    return saved;
  }
  async getFromXlsx(path: string, index: number, columns: Column[]) {
    getFromXlsx(path, index, columns)
  }
}

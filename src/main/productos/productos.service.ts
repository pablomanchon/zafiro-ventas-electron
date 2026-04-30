// src/productos/productos.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    return repo.find({ where: { deleted: false } });
  }

  async create(createDto: ProductoDto, manager?: EntityManager) {
    const productoData = this.sanitizeProductoPayload(createDto);

    const repo = manager ? manager.getRepository(Producto) : this.repo;

    // Buscar por código sin importar si está eliminado o no
    const existing = await repo.findOne({
      where: { codigo: productoData.codigo },
    });

    // Si existe y está activo, no dejar duplicar
    if (existing && !existing.deleted) {
      throw new BadRequestException('Ya existe un producto con ese código');
    }

    // Si existe pero estaba soft-deleted, lo reactivamos
    if (existing && existing.deleted) {
      Object.assign(existing, productoData, { deleted: false });
      const restored = await repo.save(existing);

      emitChange('productos:changed', { type: 'upsert', data: restored });
      return restored;
    }

    // Si no existe, crear normal
    const entity = repo.create(productoData);
    const saved = await repo.save(entity);

    emitChange('productos:changed', { type: 'upsert', data: saved });
    return saved;
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const producto = await repo.findOne({ where: { id } });
    if (!producto || producto.deleted) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  async update(id: number, updateDto: UpdateProductoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const existing = await repo.findOne({ where: { id } });
    if (!existing || existing.deleted) throw new NotFoundException('Producto no encontrado');
    const updated = await repo.save(repo.merge(existing, this.sanitizeProductoPayload(updateDto)));
    if (updated) emitChange('productos:changed', { type: 'upsert', data: updated }); // 🔔
    return updated;
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const producto = await repo.findOne({ where: { id } });
    if (!producto || producto.deleted) throw new NotFoundException('Producto no encontrado');
    producto.deleted = true;
    await repo.save(producto);
    // 🔔 notificar baja
    emitChange('productos:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }

  async decrementStock(productoId: number, cantidad: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Producto) : this.repo;
    const producto = await repo.findOne({ where: { id: productoId } });
    if (!producto || producto.deleted) throw new NotFoundException('Producto no encontrado');
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

  private sanitizeProductoPayload<T extends Partial<ProductoDto>>(payload: T): Partial<Producto> {
    const { stock, stock_minimo, stockMinimo, ...rest } = payload as T & {
      stock?: number;
      stock_minimo?: number;
      stockMinimo?: number;
    };

    const sanitized: Partial<Producto> = { ...rest };
    const minimo = stockMinimo ?? stock_minimo;

    if (minimo !== undefined) {
      sanitized.stockMinimo = minimo;
    }

    return sanitized;
  }
}

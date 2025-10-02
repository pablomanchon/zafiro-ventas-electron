// src/item-venta/item-venta.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateItemVentaDto } from './dto/create-item-venta.dto';
import { UpdateItemVentaDto } from './dto/update-item-venta.dto';
import { ItemVenta } from './entities/item-venta.entity';

@Injectable()
export class ItemVentaService {
  constructor(
    @InjectRepository(ItemVenta)
    private readonly repo: Repository<ItemVenta>,
  ) { }

  async findAll(manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ItemVenta) : this.repo;
    return repo.find();
  }

  async create(createDto: CreateItemVentaDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ItemVenta) : this.repo;
    const entity = repo.create(createDto);
    return repo.save(entity);
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ItemVenta) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateItemVentaDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ItemVenta) : this.repo;
    await repo.update(id, updateDto);
    return repo.findOne({ where: { id } });
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ItemVenta) : this.repo;
    await repo.delete(id);
    return { deleted: true };
  }
}
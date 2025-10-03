// src/vendedores/vendedores.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Vendedor } from './entities/vendedor.entity';
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';
import { emitChange } from '../broadcast/event-bus';

@Injectable()
export class VendedoresService {
  constructor(
    @InjectRepository(Vendedor)
    private readonly repo: Repository<Vendedor>,
  ) {}

  async findAll(manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Vendedor) : this.repo;
    return repo.find(); // opcional: order: { nombre: 'ASC' }
  }

  async create(createDto: CreateVendedorDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Vendedor) : this.repo;
    const entity = repo.create(createDto as Partial<Vendedor>);
    const saved = await repo.save(entity);

    // 🔔 notificar creación/actualización
    emitChange('vendedores:changed', { type: 'upsert', data: saved });
    return saved;
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Vendedor) : this.repo;
    return repo.findOne({ where: { id } as any });
  }

  async update(id: number, updateDto: UpdateVendedorDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Vendedor) : this.repo;
    await repo.update(id, updateDto as Partial<Vendedor>);
    const updated = await repo.findOne({ where: { id } as any });

    if (updated) {
      // 🔔 notificar actualización
      emitChange('vendedores:changed', { type: 'upsert', data: updated });
    }
    return updated;
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Vendedor) : this.repo;
    await repo.delete(id);

    // 🔔 notificar eliminación
    emitChange('vendedores:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }
}

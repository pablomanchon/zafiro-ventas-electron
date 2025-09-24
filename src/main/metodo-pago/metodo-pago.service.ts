// src/metodo-pago/metodo-pago.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { MetodoPago } from './entities/metodo-pago.entity';
import { emitChange } from '../broadcast/event-bus';   // 👈 importá tu bus

@Injectable()
export class MetodoPagoService {
  constructor(
    @InjectRepository(MetodoPago)
    private readonly repo: Repository<MetodoPago>,
  ) {}

  async findAll(manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    return repo.find();
  }

  async create(createDto: CreateMetodoPagoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    const entity = repo.create(createDto);
    const saved = await repo.save(entity);

    // 🔔 notificar creación
    emitChange('metodos:changed', { type: 'upsert', data: saved });
    return saved;
  }

  async findOne(id: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: string, updateDto: UpdateMetodoPagoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    await repo.update(id, updateDto);
    const updated = await repo.findOne({ where: { id } });

    if (updated) {
      // 🔔 notificar actualización
      emitChange('metodos:changed', { type: 'upsert', data: updated });
    }
    return updated;
  }

  async remove(id: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    await repo.delete(id);

    // 🔔 notificar eliminación
    emitChange('metodos:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }
}

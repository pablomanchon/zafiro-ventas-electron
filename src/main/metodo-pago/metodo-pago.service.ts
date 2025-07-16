// src/metodo-pago/metodo-pago.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { MetodoPago } from './entities/metodo-pago.entity';

@Injectable()
export class MetodoPagoService {
  constructor(
    @InjectRepository(MetodoPago)
    private readonly repo: Repository<MetodoPago>,
  ) { }

  async findAll(manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    return repo.find();
  }

  async create(createDto: CreateMetodoPagoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    const entity = repo.create(createDto);
    return repo.save(entity);
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateMetodoPagoDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    await repo.update(id, updateDto);
    return repo.findOne({ where: { id } });
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(MetodoPago) : this.repo;
    await repo.delete(id);
    return { deleted: true };
  }
}
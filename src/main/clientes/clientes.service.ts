import { Injectable } from "@nestjs/common";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { Cliente } from "./entities/cliente.entity";
import { UpdateClienteDto } from "./dto/update-cliente.dto";
import { emitChange } from "../broadcast/event-bus";

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repo: Repository<Cliente>,
  ) { }

  async findAll(manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    return repo.find();
  }

  async create(createDto: CreateClienteDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    const entity = repo.create(createDto);
    const saved = await repo.save(entity);

    // 🔔 notificar creación/actualización
    emitChange('clientes:changed', { type: 'upsert', data: saved });
    return saved;
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateClienteDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    await repo.update(id, updateDto);
    const updated = await repo.findOne({ where: { id } });

    if (updated) {
      // 🔔 notificar actualización
      emitChange('clientes:changed', { type: 'upsert', data: updated });
    }
    return updated;
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    await repo.delete(id);

    // 🔔 notificar eliminación
    emitChange('clientes:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }
}

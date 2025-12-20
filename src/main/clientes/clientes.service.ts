import { Injectable, NotFoundException } from "@nestjs/common";
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
    return repo.find({ where: { deleted: false } });
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
    const cliente = await repo.findOne({ where: { id, deleted: false } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async update(id: number, updateDto: UpdateClienteDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    const existing = await repo.findOne({ where: { id, deleted: false } });
    if (!existing) throw new NotFoundException('Cliente no encontrado');
    const updated = await repo.save(repo.merge(existing, updateDto));

    if (updated) {
      // 🔔 notificar actualización
      emitChange('clientes:changed', { type: 'upsert', data: updated });
    }
    return updated;
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    const cliente = await repo.findOne({ where: { id, deleted: false } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    cliente.deleted = true;
    await repo.save(cliente);

    // 🔔 notificar eliminación
    emitChange('clientes:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }
}

import { Injectable } from "@nestjs/common";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { Cliente } from "./entities/cliente.entity";
import { UpdateClienteDto } from "./dto/update-cliente.dto";

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
    return repo.save(entity);
  }

  async findOne(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateClienteDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    await repo.update(id, updateDto);
    return repo.findOne({ where: { id } });
  }

  async remove(id: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cliente) : this.repo;
    await repo.delete(id);
    return { deleted: true };
  }
}

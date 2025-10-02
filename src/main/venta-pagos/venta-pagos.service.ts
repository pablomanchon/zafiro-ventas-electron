// src/venta-pagos/venta-pagos.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateVentaPagoDto } from './dto/create-venta-pago.dto';
import { UpdateVentaPagoDto } from './dto/update-venta-pago.dto';
import { VentaPago } from './entities/venta-pago.entity';

@Injectable()
export class VentaPagosService {
  constructor(
    @InjectRepository(VentaPago)
    private readonly repo: Repository<VentaPago>,
  ) {}

  async create(createDto: CreateVentaPagoDto, manager?: EntityManager): Promise<VentaPago> {
    const repo = manager ? manager.getRepository(VentaPago) : this.repo;
    // Crear entidad de pago
    const pago = repo.create({ metodo: { id: createDto.metodoId }, monto: createDto.monto, cuotas: createDto.cuotas });
    return repo.save(pago);
  }

  async findAll(manager?: EntityManager): Promise<VentaPago[]> {
    const repo = manager ? manager.getRepository(VentaPago) : this.repo;
    return repo.find();
  }

  async findOne(id: number, manager?: EntityManager): Promise<VentaPago | null> {
    const repo = manager ? manager.getRepository(VentaPago) : this.repo;
    return repo.findOne({ where: { id } });
  }

  async update(id: number, updateDto: UpdateVentaPagoDto, manager?: EntityManager): Promise<VentaPago | null> {
    const repo = manager ? manager.getRepository(VentaPago) : this.repo;
    await repo.update(id, updateDto as any);
    return repo.findOne({ where: { id } });
  }

  async remove(id: number, manager?: EntityManager): Promise<{ deleted: boolean }> {
    const repo = manager ? manager.getRepository(VentaPago) : this.repo;
    await repo.delete(id);
    return { deleted: true };
  }
}

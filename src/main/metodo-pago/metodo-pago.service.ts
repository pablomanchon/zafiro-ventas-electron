// src/metodo-pago/metodo-pago.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto'
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto'
import { MetodoPago } from './entities/metodo-pago.entity'
import { emitChange } from '../broadcast/event-bus'

@Injectable()
export class MetodoPagoService {
  constructor(
    @InjectRepository(MetodoPago)
    private readonly repo: Repository<MetodoPago>,
  ) {}

  private r(manager?: EntityManager) {
    return manager ? manager.getRepository(MetodoPago) : this.repo
  }

  // ✅ por defecto: solo activos
  async findAll(manager?: EntityManager) {
    const repo = this.r(manager)
    return repo.find({
      where: { deleted: false },
      order: { id: 'ASC' }, // opcional
    })
  }

  // opcional: si querés listar también los borrados en un admin
  async findAllIncludingDeleted(manager?: EntityManager) {
    const repo = this.r(manager)
    return repo.find()
  }

  async create(createDto: CreateMetodoPagoDto, manager?: EntityManager) {
    const repo = this.r(manager)

    // (opcional) asegurate que siempre se cree activo
    const entity = repo.create({ ...createDto, id: createDto.id.trim().toUpperCase(), deleted: false })

    const saved = await repo.save(entity)
    emitChange('metodos:changed', { type: 'upsert', data: saved })
    return saved
  }

  // ✅ por defecto: no devolver borrados
  async findOne(id: string, manager?: EntityManager) {
    const repo = this.r(manager)
    id = id.trim().toUpperCase();
    return repo.findOne({ where: { id, deleted: false } })
  }

  async update(id: string, updateDto: UpdateMetodoPagoDto, manager?: EntityManager) {
    const repo = this.r(manager)
    updateDto.id = updateDto.id?.trim().toUpperCase();

    // evitá “revivir” o tocar borrados sin querer
    const exists = await repo.findOne({ where: { id, deleted: false } })
    if (!exists) throw new NotFoundException('Método de pago no encontrado')

    await repo.update(id, updateDto)
    const updated = await repo.findOne({ where: { id } })

    if (updated) emitChange('metodos:changed', { type: 'upsert', data: updated })
    return updated
  }

  // ✅ Soft delete (NO repo.delete)
  async remove(id: string, manager?: EntityManager) {
    const repo = this.r(manager)
    id = id.trim().toUpperCase();
    const mp = await repo.findOne({ where: { id } })
    if (!mp) throw new NotFoundException('Método de pago no encontrado')

    if (mp.deleted) {
      // idempotente: ya estaba borrado
      return { deleted: true }
    }

    // si querés, podés bloquear borrado del "EFECTIVO" u otros fijos:
    // if (id === 'EF') throw new BadRequestException('No se puede eliminar EFECTIVO')

    await repo.update(id, { deleted: true })

    emitChange('metodos:changed', { type: 'remove', data: { id } })
    return { deleted: true }
  }

  // (opcional) reactivar
  async restore(id: string, manager?: EntityManager) {
    const repo = this.r(manager)
    id = id.trim().toUpperCase();
    const mp = await repo.findOne({ where: { id } })
    if (!mp) throw new NotFoundException('Método de pago no encontrado')

    await repo.update(id, { deleted: false })
    const updated = await repo.findOne({ where: { id } })
    if (updated) emitChange('metodos:changed', { type: 'upsert', data: updated })
    return updated
  }
}

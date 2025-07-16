// src/venta-detalle/venta-detalle.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { CreateVentaDetalleDto } from '../venta-detalle/dto/create-venta-detalle.dto';
import { UpdateVentaDetalleDto } from '../venta-detalle/dto/update-venta-detalle.dto';
import { VentaDetalle } from '../venta-detalle/entities/venta-detalle.entity';
import { ItemVentaService } from '../item-venta/item-venta.service';

@Injectable()
export class VentaDetalleService {
  constructor(
    @InjectRepository(VentaDetalle)
    private readonly repo: Repository<VentaDetalle>,
    private readonly dataSource: DataSource,
    private readonly itemVentaSvc: ItemVentaService,
  ) { }
  async create(
    dto: CreateVentaDetalleDto,
    manager?: EntityManager,
  ): Promise<VentaDetalle> {
    // Si no tengo manager, delego a transacción (opcional)
    if (!manager) {
      // Esto asume que quieres crear cada detalle en su propia transacción.
      // Si lo gestionas en un trx mayor (desde VentasService), puedes omitir este bloque.
      return this.dataSource.transaction(txn => this.create(dto, txn));
    }

    // 1) Crear el snapshot de ItemVenta usando el mismo manager
    const item = await this.itemVentaSvc.create(dto.item, manager);

    // 2) Crear el VentaDetalle en el mismo contexto
    const detalle = manager.create(VentaDetalle, { item });

    // 3) Guardar y devolver
    return manager.save(detalle);
  }

  /**
   * Devuelve todas las líneas de venta
   */
  async findAll(manager ?: EntityManager): Promise < VentaDetalle[] > {
  const repo = manager
    ? manager.getRepository(VentaDetalle)
    : this.repo;
  return repo.find({ relations: ['item', 'venta'] });
}

  /**
   * Devuelve un solo detalle por ID
   */
  async findOne(
  id: number,
  manager ?: EntityManager,
): Promise < VentaDetalle | null > {
  const repo = manager
    ? manager.getRepository(VentaDetalle)
    : this.repo;
  return repo.findOne({ where: { id }, relations: ['item', 'venta'] });
}

  /**
   * Actualiza un solo detalle de venta
   */
  async update(
  id: number,
  updateDto: UpdateVentaDetalleDto,
  manager ?: EntityManager,
): Promise < VentaDetalle | null > {
  const repo = manager
    ? manager.getRepository(VentaDetalle)
    : this.repo;
  await repo.update(id, updateDto as any);
  return repo.findOne({ where: { id }, relations: ['item', 'venta'] });
}

  /**
   * Elimina un detalle de venta
   */
  async remove(
  id: number,
  manager ?: EntityManager,
): Promise < { deleted: boolean } > {
  const repo = manager
    ? manager.getRepository(VentaDetalle)
    : this.repo;
  await repo.delete(id);
  return { deleted: true };
}
}

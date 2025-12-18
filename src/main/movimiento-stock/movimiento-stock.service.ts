import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateMovimientoStockDto } from './dto/create-movimiento-stock.dto';
import { UpdateMovimientoStockDto } from './dto/update-movimiento-stock.dto';

import { Producto } from '../productos/entities/producto.entity';
import { MovimientoStock } from './entities/movimiento-stock.entity';

@Injectable()
export class MovimientoStockService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(MovimientoStock)
    private readonly movimientoRepo: Repository<MovimientoStock>,
  ) {}

  async create(dto: CreateMovimientoStockDto) {
    const { products, moveType } = dto;

    if (!products?.length) throw new BadRequestException('No hay productos para mover');

    if (moveType !== 'in' && moveType !== 'out') {
      throw new BadRequestException('Tipo de movimiento inválido');
    }

    return this.dataSource.transaction(async (manager) => {
      const prodRepo = manager.getRepository(Producto);
      const movRepo = manager.getRepository(MovimientoStock);

      // En tu caso idProduct ahora es el CODIGO (string)
      const codigos = products.map((p) => String(p.idProduct).trim());

      // Validar codigos vacíos
      for (const c of codigos) {
        if (!c) throw new BadRequestException('Hay un producto sin código');
      }

      // Buscar por codigo (NO por id)
      const productos = await prodRepo.find({
        where: { codigo: In(codigos) },
      });

      // Map por codigo
      const byCodigo = new Map(productos.map((p) => [p.codigo, p]));

      // Validaciones de existencia y stock
      for (const item of products) {
        const codigo = String(item.idProduct).trim();
        const prod = byCodigo.get(codigo);

        if (!prod) {
          throw new NotFoundException(`Producto código "${codigo}" no encontrado`);
        }

        const qty = Number(item.quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new BadRequestException(`Cantidad inválida para producto "${codigo}"`);
        }

        const stockActual = Number(prod.stock ?? 0);
        if (moveType === 'out' && stockActual < qty) {
          throw new BadRequestException(
            `Stock insuficiente en "${codigo}" (tiene ${stockActual}, necesita ${qty})`,
          );
        }
      }

      // Aplicar movimiento y guardar productos
      for (const item of products) {
        const codigo = String(item.idProduct).trim();
        const prod = byCodigo.get(codigo)!;

        const qty = Number(item.quantity);
        const stockActual = Number(prod.stock ?? 0);

        prod.stock = moveType === 'in' ? stockActual + qty : stockActual - qty;

        await prodRepo.save(prod);
      }

      // Guardar movimiento (snapshot)
      const movimiento = movRepo.create({
        moveType,
        productsMoveStock: products, // guardás el snapshot tal como viene
        // fecha la setea @CreateDateColumn en la entidad
      });

      await movRepo.save(movimiento);

      return {
        message: `Movimiento ${moveType === 'in' ? 'entrada' : 'salida'} aplicado`,
        movimientoId: movimiento.id,
        totalProductos: products.length,
      };
    });
  }

  async findAll() {
    return await this.movimientoRepo.find({
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: number) {
    const mov = await this.movimientoRepo.findOne({ where: { id } });
    if (!mov) throw new NotFoundException('Movimiento no encontrado');
    return mov;
  }

  async update(id: number, dto: UpdateMovimientoStockDto) {
    // Ojo: este update como lo tenías NO revierte stock del movimiento anterior.
    // Te lo dejo igual “funcional” (solo actualiza snapshot), pero no es contable.

    const mov = await this.movimientoRepo.findOne({ where: { id } });
    if (!mov) throw new NotFoundException('Movimiento no encontrado');

    if (dto.moveType && dto.moveType !== 'in' && dto.moveType !== 'out') {
      throw new BadRequestException('Tipo de movimiento inválido');
    }

    if (dto.products && dto.products.length === 0) {
      throw new BadRequestException('No hay productos para mover');
    }

    const next = this.movimientoRepo.merge(mov, {
      moveType: dto.moveType ?? mov.moveType,
      productsMoveStock: dto.products ?? mov.productsMoveStock,
    });

    return await this.movimientoRepo.save(next);
  }

  async remove(id: number) {
    // Igual que arriba: borrar un movimiento sin revertir stock deja inconsistencia.
    // Te lo dejo como estaba.
    const res = await this.movimientoRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Movimiento no encontrado');
    return { message: 'Movimiento eliminado' };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { CreateMovimientoStockDto, toDto } from './dto/create-movimiento-stock.dto';
import { Producto } from '../productos/entities/producto.entity';
import { MovimientoStock, toEntity } from './entities/movimiento-stock.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateMovimientoStockDto } from './dto/update-movimiento-stock.dto';

@Injectable()
export class MovimientoStockService {
  constructor(private readonly dataSource: DataSource, @InjectRepository(MovimientoStock)
  private readonly movimientoRepo: Repository<MovimientoStock>,) { }

  async create(dto: CreateMovimientoStockDto) {
    const { products, moveType } = dto;

    if (!products?.length) throw new BadRequestException('No hay productos para mover');
    if (moveType !== 'in' && moveType !== 'out') {
      throw new BadRequestException('Tipo de movimiento inválido');
    }

    return this.dataSource.transaction(async (manager) => {
      const prodRepo = manager.getRepository(Producto);
      const movRepo = manager.getRepository(MovimientoStock);

      const ids = products.map(p => p.idProduct);
      const productos = await prodRepo.find({ where: { id: In(ids) } });

      const byId = new Map(productos.map(p => [p.id, p]));

      for (const item of products) {
        const pid = item.idProduct;
        const prod = byId.get(pid);
        if (!prod) throw new NotFoundException(`Producto ${pid} no encontrado`);
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
          throw new BadRequestException(`Cantidad inválida para producto ${pid}`);
        }
        if (moveType === 'out' && prod.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente en producto ${pid} (tiene ${prod.stock}, necesita ${item.quantity})`,
          );
        }
      }

      for (const item of products) {
        const pid = item.idProduct;
        const prod = byId.get(pid)!;

        prod.stock =
          moveType === 'in'
            ? prod.stock + item.quantity
            : prod.stock - item.quantity;

        await prodRepo.save(prod);
      }

      // 👇 ACÁ EL CAMBIO CLAVE
      const movimiento = movRepo.create({
        moveType,              // ✅ ahora sí
        productsMoveStock: products, // snapshot
        // fecha la setea @CreateDateColumn
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
    return await this.movimientoRepo.findOne({ where: { id } })
  }

  async update(id: number, dto: UpdateMovimientoStockDto) {
    const res = await this.movimientoRepo.findOne({ where: { id } })
    if (res) {
      const moveStock = toDto(res)
      moveStock.products = dto.products!
      moveStock.moveType = dto.moveType!
      this.movimientoRepo.save(toEntity(moveStock))
    }

  }

  async remove(id: number) {
    return this.movimientoRepo.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVentaDetalleDto } from './dto/create-venta-detalle.dto';
import { UpdateVentaDetalleDto } from './dto/update-venta-detalle.dto';
import { VentaDetalle } from './entities/venta-detalle.entity';
import { ItemVenta } from '../item-venta/entities/item-venta.entity';
import { Producto } from '../productos/entities/producto.entity';

@Injectable()
export class VentaDetalleService {
  constructor(
    @InjectRepository(VentaDetalle)
    private readonly repo: Repository<VentaDetalle>,
    @InjectRepository(ItemVenta)
    private readonly itemRepo: Repository<ItemVenta>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  async create(createVentaDetalleDto: CreateVentaDetalleDto) {
    const producto = await this.productoRepo.findOne({
      where: { id: createVentaDetalleDto.productoId },
    });
    if (!producto) throw new Error('Producto no encontrado');
    const item = this.itemRepo.create({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
    });
    await this.itemRepo.save(item);
    const detalle = this.repo.create({
      item,
      cantidad: createVentaDetalleDto.cantidad,
    });
    return this.repo.save(detalle);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, updateVentaDetalleDto: UpdateVentaDetalleDto) {
    await this.repo.update(id, updateVentaDetalleDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateItemVentaDto } from './dto/create-item-venta.dto';
import { UpdateItemVentaDto } from './dto/update-item-venta.dto';
import { ItemVenta } from './entities/item-venta.entity';

@Injectable()
export class ItemVentaService {
  constructor(
    @InjectRepository(ItemVenta)
    private readonly repo: Repository<ItemVenta>,
  ) {}

  create(createItemVentaDto: CreateItemVentaDto) {
    const item = this.repo.create(createItemVentaDto);
    return this.repo.save(item);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, updateItemVentaDto: UpdateItemVentaDto) {
    await this.repo.update(id, updateItemVentaDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

import { Injectable } from '@nestjs/common';
import { CreateItemVentaDto } from './dto/create-item-venta.dto';
import { UpdateItemVentaDto } from './dto/update-item-venta.dto';

@Injectable()
export class ItemVentaService {
  create(createItemVentaDto: CreateItemVentaDto) {
    return 'This action adds a new itemVenta';
  }

  findAll() {
    return `This action returns all itemVenta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} itemVenta`;
  }

  update(id: number, updateItemVentaDto: UpdateItemVentaDto) {
    return `This action updates a #${id} itemVenta`;
  }

  remove(id: number) {
    return `This action removes a #${id} itemVenta`;
  }
}

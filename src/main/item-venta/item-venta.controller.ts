import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItemVentaService } from './item-venta.service';
import { CreateItemVentaDto } from './dto/create-item-venta.dto';
import { UpdateItemVentaDto } from './dto/update-item-venta.dto';

@Controller('item-venta')
export class ItemVentaController {
  constructor(private readonly itemVentaService: ItemVentaService) {}

  @Post()
  create(@Body() createItemVentaDto: CreateItemVentaDto) {
    return this.itemVentaService.create(createItemVentaDto);
  }

  @Get()
  findAll() {
    return this.itemVentaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemVentaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItemVentaDto: UpdateItemVentaDto) {
    return this.itemVentaService.update(+id, updateItemVentaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemVentaService.remove(+id);
  }
}

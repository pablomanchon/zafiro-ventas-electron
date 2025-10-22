import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MovimientoStockService } from './movimiento-stock.service';
import { CreateMovimientoStockDto } from './dto/create-movimiento-stock.dto';
import { UpdateMovimientoStockDto } from './dto/update-movimiento-stock.dto';

@Controller('movimiento-stock')
export class MovimientoStockController {
  constructor(private readonly movimientoStockService: MovimientoStockService) {}

  @Post()
  create(@Body() createMovimientoStockDto: CreateMovimientoStockDto) {
    return this.movimientoStockService.create(createMovimientoStockDto);
  }

  @Get()
  findAll() {
    return this.movimientoStockService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movimientoStockService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovimientoStockDto: UpdateMovimientoStockDto) {
    return this.movimientoStockService.update(+id,updateMovimientoStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movimientoStockService.remove(+id);
  }
}

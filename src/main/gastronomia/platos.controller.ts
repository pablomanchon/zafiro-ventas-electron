import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AjustarStockDto } from './dto/ajustar-stock.dto';
import { CreatePlatoDto } from './dto/create-plato.dto';
import { UpdatePlatoDto } from './dto/update-plato.dto';
import { PlatosService } from './platos.service';

@Controller('platos')
export class PlatosController {
  constructor(private readonly platosService: PlatosService) { }

  @Post()
  create(@Body() dto: CreatePlatoDto) {
    return this.platosService.create(dto);
  }

  @Get()
  findAll() {
    return this.platosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.platosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdatePlatoDto) {
    return this.platosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.platosService.remove(id);
  }

  @Post(':id/recalcular-costo')
  recalcularCosto(@Param('id') id: number) {
    return this.platosService.recalcularCosto(id);
  }

  @Post(':id/ajustar-stock')
  ajustarStock(@Param('id') id: number, @Body() dto: AjustarStockDto) {
    return this.platosService.ajustarStock(id, dto);
  }
}

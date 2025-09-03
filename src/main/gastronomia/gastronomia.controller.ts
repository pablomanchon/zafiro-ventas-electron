import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GastronomiaService } from './gastronomia.service';
import { PlatoDto } from './dto/plato.dto';

@Controller('gastronomia')
export class GastronomiaController {
  constructor(private readonly gastronomiaService: GastronomiaService) {}

  @Post()
  create(@Body() plato: PlatoDto) {
    return this.gastronomiaService.create(plato);
  }

  @Get()
  findAll() {
    return this.gastronomiaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gastronomiaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() plato: PlatoDto) {
    return this.gastronomiaService.update(+id, plato);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gastronomiaService.remove(+id);
  }
}

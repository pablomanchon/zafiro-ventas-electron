import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateIngredienteDto } from './dto/create-ingrediente.dto';
import { UpdateIngredienteDto } from './dto/update-ingrediente.dto';
import { IngredientesService } from './ingredientes.service';

@Controller('ingredientes')
export class IngredientesController {
  constructor(private readonly ingredientesService: IngredientesService) { }

  @Post()
  create(@Body() dto: CreateIngredienteDto) {
    return this.ingredientesService.create(dto);
  }

  @Get()
  findAll() {
    return this.ingredientesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.ingredientesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateIngredienteDto) {
    return this.ingredientesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.ingredientesService.remove(id);
  }
}

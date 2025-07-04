import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CelularService } from './celular.service';
import { CreateCelularDto } from './dto/create-celular.dto';
import { UpdateCelularDto } from './dto/update-celular.dto';

@Controller('celular')
export class CelularController {
  constructor(private readonly celularService: CelularService) {}

  @Post()
  create(@Body() createCelularDto: CreateCelularDto) {
    return this.celularService.create(createCelularDto);
  }

  @Get()
  findAll() {
    return this.celularService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.celularService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCelularDto: UpdateCelularDto) {
    return this.celularService.update(+id, updateCelularDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.celularService.remove(+id);
  }
}

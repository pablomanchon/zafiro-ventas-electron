import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto, MarcarEgresoDto } from './dto/create-horario.dto';

@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) { }

  @Get()
  findAll() {
    return this.horariosService.findAll();
  }

  @Post()
  marcarIngreso(@Body() createHorarioDto: CreateHorarioDto) {
    return this.horariosService.marcarIngreso(createHorarioDto);
  }

  @Post(':id')
  marcarEgreso(@Param('id') id: string, @Body() egresoDto: MarcarEgresoDto) {
    return this.horariosService.marcarEgreso(+id, egresoDto);
  }

}

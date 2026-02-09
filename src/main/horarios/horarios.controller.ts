import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { CreateHorarioDto, MarcarEgresoDto } from './dto/create-horario.dto';

@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get()
  findAll() {
    return this.horariosService.findAll()
  }

  @Get('vendedor/:id')
  findAllByVendedor(@Param('id') id: string) {
    return this.horariosService.findAllByVendedor(+id)
  }

  @Post()
  marcarIngreso(@Body() dto: CreateHorarioDto) {
    return this.horariosService.marcarIngreso(dto)
  }

  // ✅ egreso por vendedor (porque tu mensaje dice "no hay horario abierto para ese vendedor")
  @Post('vendedor/:id/egreso')
  marcarEgreso(@Param('id') id: string, @Body() dto: MarcarEgresoDto) {
    return this.horariosService.marcarEgreso(+id, dto)
  }

  // ✅ si querés mantener findOne, dejalo al final para no “tapar” rutas
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.horariosService.findOne(+id)
  }
}


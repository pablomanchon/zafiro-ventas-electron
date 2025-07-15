import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VentaPagosService } from './venta-pagos.service';
import { CreateVentaPagoDto } from './dto/create-venta-pago.dto';
import { UpdateVentaPagoDto } from './dto/update-venta-pago.dto';

@Controller('venta-pagos')
export class VentaPagosController {
  constructor(private readonly ventaPagosService: VentaPagosService) {}

  @Post()
  create(@Body() createVentaPagoDto: CreateVentaPagoDto) {
    return this.ventaPagosService.create(createVentaPagoDto);
  }

  @Get()
  findAll() {
    return this.ventaPagosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ventaPagosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVentaPagoDto: UpdateVentaPagoDto) {
    return this.ventaPagosService.update(+id, updateVentaPagoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ventaPagosService.remove(+id);
  }
}

// src/ventas/ventas.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { FilterVentasDto } from './dto/filter-ventas.dto';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) { }

  @Post()
  create(@Body() createVentaDto: CreateVentaDto) {
    return this.ventasService.create(createVentaDto);
  }

  @Get()
  findAll(@Query() filter?: FilterVentasDto) {
    return this.ventasService.findAll(filter);
  }

  // 🔒 Rutas estáticas primero
  @Get('totales/metodos')
  totalesPorMetodo(@Query() q: FilterVentasDto) {
    return this.ventasService.totalsByMetodoPago(q);
  }

  @Get('totales/tipos')
  totalesPorTipo(@Query() q: FilterVentasDto) {
    return this.ventasService.totalsByTipoPago(q);
  }

  @Get('reportes/productos-vendidos-periodo')
  productosVendidosPeriodo(
    @Query('granularity') granularity: 'day' | 'week' | 'month' = 'day',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ventasService.productosVendidosPorPeriodo(granularity, from, to);
  }
  @Get('reportes/productos-vendidos')
  productosVendidos(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ventasService.productosVendidos(from, to);
  }

  // 👇 Paramétrica al final + ParseIntPipe
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVentaDto) {
    return this.ventasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.remove(id);
  }
}

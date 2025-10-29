import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductoDto } from './dto/create-producto.dto';
import {  XlsxRequestDto } from './utils';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) { }

  @Post()
  create(@Body() createProductoDto: ProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productosService.findOne(id);
  }

  @Post('xlsx-service')
  getFromXlsx(@Body() body: XlsxRequestDto) {
    const { path, index = 0, columns = [] } = body;
    return this.productosService.getFromXlsx(path, index, columns);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productosService.update(id, updateProductoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }
}

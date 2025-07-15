import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Producto } from '../productos/entities/producto.entity';
import { ItemVenta } from '../item-venta/entities/item-venta.entity';
import { VentaDetalle } from '../venta-detalle/entities/venta-detalle.entity';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';
import { VentaPago } from '../venta-pagos/entities/venta-pago.entity';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly repo: Repository<Venta>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(ItemVenta)
    private readonly itemRepo: Repository<ItemVenta>,
    @InjectRepository(VentaDetalle)
    private readonly detalleRepo: Repository<VentaDetalle>,
    @InjectRepository(MetodoPago)
    private readonly metodoRepo: Repository<MetodoPago>,
    @InjectRepository(VentaPago)
    private readonly pagoRepo: Repository<VentaPago>,
  ) {}

  async create(createVentaDto: CreateVentaDto) {
    const cliente = await this.clienteRepo.findOne({
      where: { id: createVentaDto.clienteId },
    });
    if (!cliente) throw new Error('Cliente no encontrado');

    const venta = this.repo.create({ cliente });

    venta.detalles = [];
    for (const detDto of createVentaDto.detalles) {
      const producto = await this.productoRepo.findOne({
        where: { id: detDto.productoId },
      });
      if (!producto) throw new Error('Producto no encontrado');
      const item = this.itemRepo.create({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
      });
      await this.itemRepo.save(item);
      const detalle = this.detalleRepo.create({
        item,
        cantidad: detDto.cantidad,
      });
      venta.detalles.push(detalle);
    }

    venta.pagos = [];
    for (const pagoDto of createVentaDto.pagos) {
      const metodo = await this.metodoRepo.findOne({
        where: { id: pagoDto.metodoId },
      });
      if (!metodo) throw new Error('Método de pago no encontrado');
      const pago = this.pagoRepo.create({
        metodo,
        monto: pagoDto.monto,
        cuotas: pagoDto.cuotas,
      });
      venta.pagos.push(pago);
    }

    return this.repo.save(venta);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, updateVentaDto: UpdateVentaDto) {
    const venta = await this.repo.findOne({ where: { id } });
    if (!venta) throw new Error('Venta no encontrada');

    if (updateVentaDto.clienteId) {
      const cliente = await this.clienteRepo.findOne({
        where: { id: updateVentaDto.clienteId },
      });
      if (cliente) venta.cliente = cliente;
    }

    return this.repo.save(venta);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

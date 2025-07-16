// src/ventas/ventas.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { ItemVentaService } from '../item-venta/item-venta.service';
import { VentaDetalleService } from '../venta-detalle/venta-detalle.service';
import { VentaPagosService } from '../venta-pagos/venta-pagos.service';
import { ProductosService } from '../productos/productos.service';
import { ClientesService } from '../clientes/clientes.service';
import { CreateVentaDetalleDto } from '../venta-detalle/dto/create-venta-detalle.dto';

@Injectable()
export class VentasService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Venta)
    private readonly ventaRepo: Repository<Venta>,
    private readonly clienteSvc: ClientesService,
    private readonly productoSvc: ProductosService,
    private readonly itemVentaSvc: ItemVentaService,
    private readonly ventaDetalleSvc: VentaDetalleService,
    private readonly ventaPagoSvc: VentaPagosService,
  ) {}

// src/ventas/ventas.service.ts
async create(dto: CreateVentaDto, manager?: EntityManager): Promise<Venta> {
  if (!manager) {
    return this.dataSource.transaction(txn => this.create(dto, txn));
  }

  // 1) Cliente
  const cliente = await this.clienteSvc.findOne(dto.clienteId, manager);
  if (!cliente) throw new Error('Cliente no encontrado');

  // 2) Cabecera
  const venta = manager.create(Venta, { cliente, fecha: new Date() });

  // 3) Detalles + snapshot
  venta.detalles = [];
  let totalEstimado = 0;
  for (const det of dto.detalles) {
    // — a) Descontar stock usando productId
    const producto = await this.productoSvc.decrementStock(
      det.productoId,
      det.item.cantidad,
      manager,
    );

    // — b) Prepara el DTO para VentaDetalleService (solo necesita el snapshot)
    const detalleDto: CreateVentaDetalleDto = {
      productoId: det.productoId,   // quedará en el DTO pero no se usa en la creación de VentaDetalle
      item: {
        nombre:      producto.nombre,
        descripcion: producto.descripcion,
        precio:      producto.precio,
        cantidad:    det.item.cantidad,
      },
    };

    // — c) Crear el detalle (con su ItemVenta dentro)
    const ventaDet = await this.ventaDetalleSvc.create(detalleDto, manager);

    totalEstimado += Number(producto.precio) * det.item.cantidad;
    venta.detalles.push(ventaDet);
  }

  // 4) Pagos y verificación idéntica
  venta.pagos = [];
  let totalPagado = 0;
  for (const p of dto.pagos) {
    const pago = await this.ventaPagoSvc.create(
      { metodoId: p.metodoId, monto: p.monto, cuotas: p.cuotas },
      manager,
    );
    totalPagado += Number(pago.monto);
    venta.pagos.push(pago);
  }

  if (totalPagado !== totalEstimado) {
    throw new Error(
      `Total pagado (${totalPagado.toFixed(2)}) no coincide con total de venta (${totalEstimado.toFixed(2)})`,
    );
  }

  // 5) Guardar todo
  return manager.save(venta);
}


  async findAll(manager?: EntityManager): Promise<Venta[]> {
    const repo = manager
      ? manager.getRepository(Venta)
      : this.ventaRepo;

    return repo.find({
      relations: ['detalles', 'detalles.item', 'pagos'],
    });
  }

  async findOne(
    id: number,
    manager?: EntityManager,
  ): Promise<Venta | null> {
    const repo = manager
      ? manager.getRepository(Venta)
      : this.ventaRepo;

    return repo.findOne({
      where: { id },
      relations: ['detalles', 'detalles.item', 'pagos'],
    });
  }

  async update(
    id: number,
    dto: UpdateVentaDto,
    manager?: EntityManager,
  ): Promise<Venta | null> {
    const repo = manager
      ? manager.getRepository(Venta)
      : this.ventaRepo;

    await repo.update(id, { cliente: { id: dto.clienteId } } as any);
    return this.findOne(id, manager);
  }

  async remove(
    id: number,
    manager?: EntityManager,
  ): Promise<{ deleted: boolean }> {
    if (manager) {
      await manager.getRepository(Venta).delete(id);
    } else {
      await this.ventaRepo.delete(id);
    }
    return { deleted: true };
  }
}

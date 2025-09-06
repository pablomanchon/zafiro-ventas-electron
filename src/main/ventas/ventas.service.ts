// src/ventas/ventas.service.ts
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DeepPartial,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Venta } from './entities/venta.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { FilterVentasDto } from './dto/filter-ventas.dto';
import { ClientesService } from '../clientes/clientes.service';
import { ProductosService } from '../productos/productos.service';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';
import { VentaPago } from '../venta-pagos/entities/venta-pago.entity';
import { VentaDetalle } from '../venta-detalle/entities/venta-detalle.entity';
import { ItemVenta } from '../item-venta/entities/item-venta.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
// Helpers (fuera de la clase)
type NumberLike = string | number;

function normalizeRange(from?: string, to?: string) {
  const parts: string[] = [];
  const params: Record<string, any> = {};

  if (from) {
    // desde el comienzo de 'from'
    const fromDate = new Date(from);
    parts.push('v.fecha >= :from');
    params.from = fromDate;
  }

  if (to) {
    // incluir TODO el día 'to' -> sumo 1 día y uso '<'
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    parts.push('v.fecha < :to');
    params.to = toDate;
  }

  return { where: parts.join(' AND '), params };
}

function sumExpr(db: string) {
  // En SQLite DECIMAL puede ser texto: conviene castear
  return db === 'sqlite' ? 'SUM(CAST(pg.monto AS REAL))' : 'SUM(pg.monto)';
}

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta) private readonly repo: Repository<Venta>,
    @InjectRepository(VentaPago) private readonly pagoRepo: Repository<VentaPago>,
    private readonly clienteService: ClientesService,
    private readonly productoService: ProductosService
  ) { }

  async create(createDto: CreateVentaDto): Promise<Venta> {
    // 1) Validaciones
    const validDetalles = createDto.detalles.filter(
      d => d.productoId?.toString().trim() !== ''
    );
    if (!validDetalles.length) {
      throw new BadRequestException('Debe incluir al menos un producto con ID válido');
    }
    const validPagos = createDto.pagos.filter(
      p => p.metodoId?.toString().trim() !== ''
    );
    if (!validPagos.length) {
      throw new BadRequestException('Debe incluir al menos un método de pago con ID válido');
    }
    if (createDto.clienteId == null) {
      throw new BadRequestException('Debe seleccionar un cliente');
    }

    // 2) Cliente
    const cliente = await this.clienteService.findOne(createDto.clienteId);
    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado');
    }

    // 3) Stock
    for (const det of validDetalles) {
      await this.productoService.decrementStock(det.productoId.toString(), det.item.cantidad);
    }

    // 4) Totales
    const totalDetalles = validDetalles.reduce(
      (sum, det) => sum + Number(det.item.precio) * det.item.cantidad,
      0
    );
    const totalPagos = validPagos.reduce(
      (sum, pago) => sum + Number(pago.monto),
      0
    );
    if (Number(totalDetalles.toFixed(2)) !== Number(totalPagos.toFixed(2))) {
      throw new BadRequestException(
        `Total de pagos (${totalPagos}) no coincide con total de venta (${totalDetalles})`
      );
    }

    const pagosEntity: DeepPartial<VentaPago>[] = validPagos.map(p => ({
      monto: Number(p.monto),
      // 👇 si hay cuotas, la incluyo; si no, NO la mando (queda undefined)
      ...(p.cuotas !== undefined && p.cuotas !== null ? { cuotas: Number(p.cuotas) } : {}),
      metodo: { id: p.metodoId } as DeepPartial<MetodoPago>,
    }));

    const detallesEntity: DeepPartial<VentaDetalle>[] = validDetalles.map(d => ({
      item: {
        nombre: d.item.nombre,
        descripcion: d.item.descripcion ?? undefined,
        precio: Number(d.item.precio),
        cantidad: Number(d.item.cantidad),
      } as DeepPartial<ItemVenta>,
    }));

    const ventaPartial: DeepPartial<Venta> = {
      cliente: { id: cliente.id } as DeepPartial<Cliente>,
      detalles: detallesEntity,
      pagos: pagosEntity,
      total: Number(totalDetalles.toFixed(2)),
    };

    const venta = this.repo.create(ventaPartial);
    return this.repo.save(venta);
  }

  async findAll(filter?: FilterVentasDto): Promise<Venta[]> {
    const where: any = {};

    if (filter?.from && filter?.to) {
      where.fecha = Between(new Date(filter.from), new Date(filter.to)); // [from, to]
    } else if (filter?.from) {
      where.fecha = MoreThanOrEqual(new Date(filter.from));
    } else if (filter?.to) {
      where.fecha = LessThan(new Date(filter.to)); // exclusivo
    }

    return this.repo.find({
      where,
      order: { fecha: 'DESC' },
      relations: ['cliente', 'detalles', 'pagos'],
    });
  }

  async findOne(id: number): Promise<Venta> {
    return this.repo.findOneOrFail({
      where: { id },
      relations: ['cliente', 'detalles', 'pagos'],
    });
  }

  async update(id: number, dto: UpdateVentaDto): Promise<Venta> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.repo.delete(id);
    return { deleted: true };
  }

  // Totales por TIPO
  async totalsByTipoPago(
    filter?: FilterVentasDto
  ): Promise<Array<{ tipo: MetodoPago['tipo']; total: number }>> {
    const conn = this.pagoRepo.manager.connection;
    const dbType = conn.options.type as string;

    const { where, params } = normalizeRange(filter?.from, filter?.to);

    const qb = this.pagoRepo.createQueryBuilder('pg')
      .innerJoin('pg.venta', 'v')      // para filtrar por fecha
      .innerJoin('pg.metodo', 'mp')    // asegura que tenga método
      .select('mp.tipo', 'tipo')
      .addSelect(`${sumExpr(dbType)}`, 'total');

    if (where) qb.where(where, params);

    const rows = await qb
      .groupBy('mp.tipo')
      .orderBy('total', 'DESC')
      .getRawMany<{ tipo: MetodoPago['tipo']; total: string | number }>();

    return rows.map(r => ({ tipo: r.tipo, total: Number(r.total) }));
  }

  // Totales por MÉTODO
  async totalsByMetodoPago(
    filter?: FilterVentasDto
  ): Promise<Array<{ metodoId: string; nombre: string; tipo: MetodoPago['tipo'] | null; total: number }>> {
    const conn = this.pagoRepo.manager.connection;
    const dbType = conn.options.type as string;

    const { where, params } = normalizeRange(filter?.from, filter?.to);

    const qb = this.pagoRepo.createQueryBuilder('pg')
      .innerJoin('pg.venta', 'v')
      .leftJoin('pg.metodo', 'mp')
      .select('COALESCE(mp.id, \'(sin_metodo)\')', 'metodoId')
      .addSelect('COALESCE(mp.nombre, \'(sin nombre)\')', 'nombre')
      .addSelect('mp.tipo', 'tipo')
      .addSelect(`${sumExpr(dbType)}`, 'total');

    if (where) qb.where(where, params);

    const rows = await qb
      .groupBy('mp.id')
      .addGroupBy('mp.nombre')
      .addGroupBy('mp.tipo')
      .orderBy('total', 'DESC')
      .getRawMany<{ metodoId: string | null; nombre: string | null; tipo: MetodoPago['tipo'] | null; total: string | number }>();

    return rows.map(r => ({
      metodoId: r.metodoId ?? '(sin_metodo)',
      nombre: r.nombre ?? '(sin nombre)',
      tipo: r.tipo ?? null,
      total: Number(r.total),
    }));
  }

}

// src/ventas/ventas.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DeepPartial,
  In,
  LessThan,
  MoreThanOrEqual,
  Repository,
  DataSource,
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
import { CajaService } from '../caja/caja.service';
import { Producto } from '../productos/entities/producto.entity';

// Helpers (fuera de la clase)
type NumberLike = string | number;

function normalizeRange(from?: string, to?: string) {
  const parts: string[] = [];
  const params: Record<string, any> = {};

  if (from) {
    const fromDate = new Date(from);
    parts.push('v.fecha >= :from');
    params.from = fromDate;
  }

  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1); // incluir todo el día "to"
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
    @InjectRepository(MetodoPago) private readonly metodoRepo: Repository<MetodoPago>,
    private readonly clienteService: ClientesService,
    private readonly productoService: ProductosService, // lo dejo por si lo usás en otros métodos
    private readonly dataSource: DataSource,
    private readonly cajaService: CajaService,
  ) { }

  async create(createDto: CreateVentaDto): Promise<Venta> {
    // 1) Validaciones base
    const validDetalles = (createDto.detalles ?? []).filter(
      d => d.productoId?.toString().trim() !== '',
    );
    if (!validDetalles.length) {
      throw new BadRequestException('Debe incluir al menos un producto con ID válido');
    }
    const validPagos = (createDto.pagos ?? []).filter(
      p => p.metodoId?.toString().trim() !== '',
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

    // 3) Totales previos
    const totalDetalles = validDetalles.reduce(
      (sum, det) => sum + Number(det.item.precio) * Number(det.item.cantidad),
      0,
    );
    const totalPagos = validPagos.reduce(
      (sum, pago) => sum + Number(pago.monto),
      0,
    );
    if (Number(totalDetalles.toFixed(2)) !== Number(totalPagos.toFixed(2))) {
      throw new BadRequestException(
        `Total de pagos (${totalPagos}) no coincide con total de venta (${totalDetalles})`,
      );
    }

    // 4) Traer tipos de método de pago para calcular EFECTIVO
    const metodoIds = validPagos.map(p => p.metodoId);
    const metodos = await this.metodoRepo.find({ where: { id: In(metodoIds) } });
    const metodosById = new Map(metodos.map(m => [m.id, m]));
    const totalEfectivo = validPagos
      .filter(p => metodosById.get(p.metodoId)?.tipo === 'efectivo')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);

    const totalUsd = validPagos
      .filter(p => metodosById.get(p.metodoId)?.tipo === 'usd')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);

    // 5) Mapear entidades
    const pagosEntity: DeepPartial<VentaPago>[] = validPagos.map(p => ({
      monto: Number(p.monto),
      ...(p.cuotas !== undefined && p.cuotas !== null
        ? { cuotas: Number(p.cuotas) }
        : {}),
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

    // 6) TRANSACCIÓN: descuento de stock + venta + detalles + pagos + caja
    return await this.dataSource.transaction(async (manager) => {
      const ventaRepoTx = manager.getRepository(Venta);
      const pagoRepoTx = manager.getRepository(VentaPago);
      const detalleRepoTx = manager.getRepository(VentaDetalle);
      const productoRepoTx = manager.getRepository(Producto);

      // 6.a) Descontar stock por cada detalle (atómico)
      for (const det of validDetalles) {
        const productoId = det.productoId.toString();
        const cant = Number(det.item.cantidad);

        const prod = await productoRepoTx.findOne({ where: { id: productoId } });
        if (!prod) {
          throw new NotFoundException(`Producto ${productoId} no encontrado`);
        }
        const stockActual = Number(prod.stock ?? 0);
        if (stockActual < cant) {
          throw new BadRequestException(
            `Stock insuficiente para "${prod.nombre ?? productoId}" (stock: ${stockActual}, solicitado: ${cant})`,
          );
        }

        // Actualizar y guardar
        prod.stock = stockActual - cant;
        await productoRepoTx.save(prod);
      }

      // 6.b) Crear venta base
      const venta = ventaRepoTx.create({
        cliente: { id: cliente.id } as DeepPartial<Cliente>,
        total: Number(totalDetalles.toFixed(2)),
      });
      await ventaRepoTx.save(venta);

      // 6.c) Guardar detalles
      for (const d of detallesEntity) {
        const det = detalleRepoTx.create({ ...d, venta: { id: venta.id } as any });
        await detalleRepoTx.save(det);
      }

      // 6.d) Guardar pagos
      for (const p of pagosEntity) {
        const pago = pagoRepoTx.create({ ...p, venta: { id: venta.id } as any });
        await pagoRepoTx.save(pago);
      }

      // 6.e) Actualizar CAJA con el total en EFECTIVO
      if (totalEfectivo > 0) {
        await this.cajaService.incrementarPesosTx(totalEfectivo, manager);
      }

      if (totalUsd > 0) {
        await this.cajaService.incrementarUsdTx(totalUsd, manager);
      }

      // 6.f) Devolver venta completa con relaciones
      return await ventaRepoTx.findOneOrFail({
        where: { id: venta.id },
        relations: ['cliente', 'detalles', 'pagos'],
      });
    });
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
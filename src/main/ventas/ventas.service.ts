// src/main/ventas/ventas.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  DeepPartial,
  EntityManager,
  In,
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
import { CajaService } from '../caja/caja.service';
import { Producto } from '../productos/entities/producto.entity';
import { emitChange } from '../broadcast/event-bus';

type Granularity = 'day' | 'week' | 'month';

function timeBucketExpr(db: string, granularity: Granularity) {
  if (db === 'sqlite') {
    switch (granularity) {
      case 'day': return "strftime('%Y-%m-%d', v.fecha)";
      case 'week': return "strftime('%Y-W%W', v.fecha)";
      case 'month': return "strftime('%Y-%m', v.fecha)";
    }
  } else {
    switch (granularity) {
      case 'day': return "to_char(date_trunc('day', v.fecha), 'YYYY-MM-DD')";
      case 'week': return "to_char(date_trunc('week', v.fecha), 'IYYY-\"W\"IW')";
      case 'month': return "to_char(date_trunc('month', v.fecha), 'YYYY-MM')";
    }
  }
}

function sumCantidadExpr(db: string) {
  return db === 'sqlite' ? 'SUM(CAST(it.cantidad AS REAL))' : 'SUM(it.cantidad)';
}

function sumImporteExpr(db: string) {
  return db === 'sqlite'
    ? 'SUM(CAST(it.precio AS REAL) * CAST(it.cantidad AS REAL))'
    : 'SUM(it.precio * it.cantidad)';
}

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
    toDate.setDate(toDate.getDate() + 1);
    parts.push('v.fecha < :to');
    params.to = toDate;
  }
  return { where: parts.join(' AND '), params };
}

function sumExpr(db: string) {
  return db === 'sqlite' ? 'SUM(CAST(pg.monto AS REAL))' : 'SUM(pg.monto)';
}

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta) private readonly repo: Repository<Venta>,
    @InjectRepository(VentaPago) private readonly pagoRepo: Repository<VentaPago>,
    @InjectRepository(MetodoPago) private readonly metodoRepo: Repository<MetodoPago>,
    private readonly clienteService: ClientesService,
    private readonly productoService: ProductosService,
    private readonly dataSource: DataSource,
    private readonly cajaService: CajaService,
  ) { }

  async create(createDto: CreateVentaDto): Promise<Venta> {
    // 1) Validaciones base
    const validDetalles = (createDto.detalles ?? []).filter(d =>
      Number.isFinite(Number(d.productoId)),
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

    // 4) Tipos de método de pago (para caja)
    const metodoIds = validPagos.map(p => p.metodoId);
    const metodos = await this.metodoRepo.find({ where: { id: In(metodoIds) } });
    const metodosById = new Map(metodos.map(m => [m.id, m]));

    const totalEfectivo = validPagos
      .filter(p => metodosById.get(p.metodoId)?.tipo.toLowerCase() === 'efectivo')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);

    const totalUsd = validPagos
      .filter(p => metodosById.get(p.metodoId)?.tipo.toLowerCase() === 'usd')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);

    // 5) Pagos (entidades)
    const pagosEntity: DeepPartial<VentaPago>[] = validPagos.map(p => ({
      monto: Number(p.monto),
      ...(p.cuotas !== undefined && p.cuotas !== null ? { cuotas: Number(p.cuotas) } : {}),
      metodo: { id: p.metodoId } as DeepPartial<MetodoPago>,
    }));

    // 6) TRANSACCIÓN: stock + venta + detalles + pagos + caja
    const { venta: savedVenta, productos: productosActualizados } =
      await this.dataSource.transaction(async (manager) => {
        const ventaRepoTx = manager.getRepository(Venta);
        const pagoRepoTx = manager.getRepository(VentaPago);
        const detalleRepoTx = manager.getRepository(VentaDetalle);
        const productoRepoTx = manager.getRepository(Producto);

        const productosActualizados: Producto[] = [];

        // ✅ precargar productos por ID (una sola query)
        const ids = validDetalles.map(d => Number(d.productoId));
        const productos = await productoRepoTx.find({ where: { id: In(ids) } });
        const byId = new Map(productos.map(p => [p.id, p]));

        // 6.a) validar + descontar stock
        for (const det of validDetalles) {
          const productoId = Number(det.productoId);
          const cant = Number(det.item.cantidad);

          if (!Number.isFinite(cant) || cant <= 0) {
            throw new BadRequestException(`Cantidad inválida para producto ${productoId}`);
          }

          const prod = byId.get(productoId);
          if (!prod || prod.deleted) throw new NotFoundException(`Producto ${productoId} no encontrado`);

          const stockActual = Number(prod.stock ?? 0);
          if (stockActual < cant) {
            throw new BadRequestException(
              `Stock insuficiente para "${prod.nombre ?? productoId}" (stock: ${stockActual}, solicitado: ${cant})`,
            );
          }

          prod.stock = stockActual - cant;
          const savedProd = await productoRepoTx.save(prod);
          productosActualizados.push(savedProd);
        }

        // 6.b) Crear venta base
        const venta = ventaRepoTx.create({
          cliente: { id: cliente.id } as DeepPartial<Cliente>,
          total: Number(totalDetalles.toFixed(2)),
        });
        await ventaRepoTx.save(venta);

        // 6.c) Detalles (snapshot) ✅ ahora incluye codigo del producto
        for (const det of validDetalles) {
          const productoId = Number(det.productoId);
          const prod = byId.get(productoId);
          if (!prod) throw new NotFoundException(`Producto ${productoId} no encontrado`);

          const detalle = detalleRepoTx.create({
            venta: { id: venta.id } as any,
            item: {
              codigo: prod.codigo, // ✅ clave
              nombre: det.item.nombre,
              descripcion: det.item.descripcion ?? undefined,
              precio: Number(det.item.precio),
              cantidad: Number(det.item.cantidad),
            } as DeepPartial<ItemVenta>,
          });

          await detalleRepoTx.save(detalle);
        }

        // 6.d) Pagos
        for (const p of pagosEntity) {
          const pago = pagoRepoTx.create({ ...p, venta: { id: venta.id } as any });
          await pagoRepoTx.save(pago);
        }

        // 6.e) Caja
        if (totalEfectivo > 0) await this.cajaService.incrementarPesosTx(totalEfectivo, manager);
        if (totalUsd > 0) await this.cajaService.incrementarUsdTx(totalUsd, manager);

        // 6.f) Venta completa
        const ventaCompleta = await ventaRepoTx.findOneOrFail({
          where: { id: venta.id },
          relations: ['cliente', 'detalles', 'pagos'],
        });

        return { venta: ventaCompleta, productos: productosActualizados };
      });

    // Fuera de tx (commit ok): emitir
    emitChange('ventas:changed', { type: 'upsert', data: savedVenta });
    for (const p of productosActualizados) {
      emitChange('productos:changed', { type: 'upsert', data: p });
    }

    return savedVenta;
  }

  async findAll(filter?: FilterVentasDto): Promise<Venta[]> {
    const where: any = {};
    where.deleted = false;
    where.cliente = { deleted: false } as any;

    if (filter?.from && filter?.to) {
      where.fecha = Between(new Date(filter.from), new Date(filter.to));
    } else if (filter?.from) {
      where.fecha = MoreThanOrEqual(new Date(filter.from));
    } else if (filter?.to) {
      where.fecha = LessThan(new Date(filter.to));
    }

    return this.repo.find({
      where,
      order: { fecha: 'DESC' },
      relations: ['cliente', 'detalles', 'pagos'],
    });
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'detalles', 'pagos'],
    });
    if (!venta || venta.deleted || (venta.cliente && (venta.cliente as any).deleted)) {
      throw new NotFoundException('Venta no encontrada');
    }
    return venta;
  }

  async update(id: number, dto: UpdateVentaDto): Promise<Venta> {
    const venta = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'detalles', 'pagos'],
    });
    if (!venta || venta.deleted) throw new NotFoundException('Venta no encontrada');

    await this.repo.save(this.repo.merge(venta, dto));
    const updated = await this.findOne(id);
    emitChange('ventas:changed', { type: 'upsert', data: updated });
    return updated;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const venta = await this.repo.findOne({ where: { id } });
    if (!venta || venta.deleted) throw new NotFoundException('Venta no encontrada');
    venta.deleted = true;
    await this.repo.save(venta);
    emitChange('ventas:changed', { type: 'remove', data: { id } });
    return { deleted: true };
  }

  async totalsByTipoPago(
    filter?: FilterVentasDto
  ): Promise<Array<{ tipo: MetodoPago['tipo']; total: number }>> {
    const conn = this.pagoRepo.manager.connection;
    const dbType = conn.options.type as string;

    const { where, params } = normalizeRange(filter?.from, filter?.to);

    const qb = this.pagoRepo.createQueryBuilder('pg')
      .innerJoin('pg.venta', 'v')
      .innerJoin('pg.metodo', 'mp')
      .select('mp.tipo', 'tipo')
      .addSelect(`${sumExpr(dbType)}`, 'total');

    qb.where('v.deleted = false');
    if (where) qb.andWhere(where, params);

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

    qb.where('v.deleted = false');
    if (where) qb.andWhere(where, params);

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

  async productosVendidos(
    from?: string,
    to?: string,
  ): Promise<Array<{ nombre: string; cantidad: number; importe: number }>> {
    const conn = this.repo.manager.connection;
    const dbType = conn.options.type as string;

    const sumCant = sumCantidadExpr(dbType);
    const sumImp = sumImporteExpr(dbType);
    const { where, params } = normalizeRange(from, to);

    const qb = this.dataSource
      .getRepository(VentaDetalle)
      .createQueryBuilder('det')
      .innerJoin('det.venta', 'v')
      .innerJoin('det.item', 'it')
      .select('it.nombre', 'nombre')
      .addSelect(`${sumCant}`, 'cantidad')
      .addSelect(`${sumImp}`, 'importe');

    qb.where('v.deleted = false');
    if (where) qb.andWhere(where, params);

    const rows = await qb
      .groupBy('it.nombre')
      .orderBy('cantidad', 'DESC')
      .getRawMany<{ nombre: string; cantidad: string | number; importe: string | number }>();

    return rows.map(r => ({
      nombre: r.nombre,
      cantidad: Number(r.cantidad) || 0,
      importe: Number(r.importe) || 0,
    }));
  }

  async productosVendidosPorPeriodo(
    granularity: Granularity,
    from?: string,
    to?: string,
  ): Promise<Array<{ periodo: string; nombre: string; cantidad: number; importe: number }>> {
    const conn = this.repo.manager.connection;
    const dbType = conn.options.type as string;

    const bucket = timeBucketExpr(dbType, granularity);
    const sumCant = sumCantidadExpr(dbType);
    const sumImp = sumImporteExpr(dbType);
    const { where, params } = normalizeRange(from, to);

    const qb = this.dataSource
      .getRepository(VentaDetalle)
      .createQueryBuilder('det')
      .innerJoin('det.venta', 'v')
      .innerJoin('det.item', 'it')
      .select(`${bucket}`, 'periodo')
      .addSelect('it.nombre', 'nombre')
      .addSelect(`${sumCant}`, 'cantidad')
      .addSelect(`${sumImp}`, 'importe');

    qb.where('v.deleted = false');
    if (where) qb.andWhere(where, params);

    const rows = await qb
      .groupBy(bucket)
      .addGroupBy('it.nombre')
      .orderBy('periodo', 'ASC')
      .addOrderBy('cantidad', 'DESC')
      .getRawMany<{ periodo: string; nombre: string; cantidad: string | number; importe: string | number }>();

    return rows.map(r => ({
      periodo: r.periodo,
      nombre: r.nombre,
      cantidad: Number(r.cantidad) || 0,
      importe: Number(r.importe) || 0,
    }));
  }

  // ✅ helper coherente con tu regla: producto = Producto | number(id)
  async crearDetalleDesdeProducto(
    producto: Producto | number,
    cantidad: number,
    manager?: EntityManager,
  ): Promise<DeepPartial<VentaDetalle>> {
    const repo = manager
      ? manager.getRepository(Producto)
      : this.dataSource.getRepository(Producto);

    const entidad =
      typeof producto === 'number'
        ? await repo.findOne({ where: { id: producto } })
        : producto;

    if (!entidad || entidad.deleted) throw new NotFoundException('Producto no encontrado');

    const stockActual = Number(entidad.stock ?? 0);
    const cant = Number(cantidad);

    if (!Number.isFinite(cant) || cant <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    if (stockActual < cant) {
      throw new BadRequestException(
        `Stock insuficiente para "${entidad.nombre}" (stock: ${stockActual}, solicitado: ${cant})`,
      );
    }

    entidad.stock = stockActual - cant;
    await repo.save(entidad);

    return {
      item: {
        codigo: entidad.codigo, // ✅ snapshot con codigo
        nombre: entidad.nombre,
        descripcion: entidad.descripcion ?? undefined,
        precio: Number(entidad.precio),
        cantidad: cant,
      } as DeepPartial<ItemVenta>,
    };
  }
}

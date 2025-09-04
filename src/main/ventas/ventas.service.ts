// src/ventas/ventas.service.ts
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
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

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly repo: Repository<Venta>,
    private readonly clienteService: ClientesService,
    private readonly productoService: ProductosService
  ) { }

  async create(createDto: CreateVentaDto): Promise<Venta> {
    // 1) Validar al menos un detalle y un pago con ID no vacío
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

    // 2) Buscar cliente
    const cliente = await this.clienteService.findOne(createDto.clienteId);
    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado');
    }

    // 3) Descontar stock usando el método dedicado
    for (const det of validDetalles) {
      try {
        await this.productoService.decrementStock(det.productoId.toString(), det.item.cantidad);
      } catch (e) {
        // Propagar errores de stock insuficiente o producto no encontrado
        throw new BadRequestException((e as any).message);
      }
    }

    // 4) Calcular totales
    const totalDetalles = validDetalles.reduce(
      (sum, det) => sum + det.item.precio * det.item.cantidad,
      0
    );
    const totalPagos = validPagos.reduce(
      (sum, pago) => sum + Number(pago.monto),
      0
    );
    if (totalDetalles !== totalPagos) {
      throw new BadRequestException(
        `Total de pagos (${totalPagos}) no coincide con total de venta (${totalDetalles})`
      );
    }

    // 5) Crear la venta con cascade de detalles, pagos y total
    const venta = this.repo.create({
      cliente,
      detalles: validDetalles,
      pagos: validPagos,
      total: totalDetalles,
    });

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
}

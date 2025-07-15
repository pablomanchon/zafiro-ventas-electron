import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVentaPagoDto } from './dto/create-venta-pago.dto';
import { UpdateVentaPagoDto } from './dto/update-venta-pago.dto';
import { VentaPago } from './entities/venta-pago.entity';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';

@Injectable()
export class VentaPagosService {
  constructor(
    @InjectRepository(VentaPago)
    private readonly repo: Repository<VentaPago>,
    @InjectRepository(MetodoPago)
    private readonly metodoRepo: Repository<MetodoPago>,
  ) {}

  async create(createVentaPagoDto: CreateVentaPagoDto) {
    const metodo = await this.metodoRepo.findOne({
      where: { id: createVentaPagoDto.metodoId },
    });
    if (!metodo) throw new Error('Método de pago no encontrado');
    const pago = this.repo.create({
      metodo,
      monto: createVentaPagoDto.monto,
      cuotas: createVentaPagoDto.cuotas,
    });
    return this.repo.save(pago);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, updateVentaPagoDto: UpdateVentaPagoDto) {
    await this.repo.update(id, updateVentaPagoDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}

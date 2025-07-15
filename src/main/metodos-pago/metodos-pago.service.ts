import { Injectable } from '@nestjs/common';
import { CreateMetodosPagoDto } from './dto/create-metodos-pago.dto';
import { UpdateMetodosPagoDto } from './dto/update-metodos-pago.dto';

@Injectable()
export class MetodosPagoService {
  create(createMetodosPagoDto: CreateMetodosPagoDto) {
    return 'This action adds a new metodosPago';
  }

  findAll() {
    return `This action returns all metodosPago`;
  }

  findOne(id: number) {
    return `This action returns a #${id} metodosPago`;
  }

  update(id: number, updateMetodosPagoDto: UpdateMetodosPagoDto) {
    return `This action updates a #${id} metodosPago`;
  }

  remove(id: number) {
    return `This action removes a #${id} metodosPago`;
  }
}

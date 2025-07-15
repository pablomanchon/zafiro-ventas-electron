import { Injectable } from '@nestjs/common';
import { CreateVentaPagoDto } from './dto/create-venta-pago.dto';
import { UpdateVentaPagoDto } from './dto/update-venta-pago.dto';

@Injectable()
export class VentaPagosService {
  create(createVentaPagoDto: CreateVentaPagoDto) {
    return 'This action adds a new ventaPago';
  }

  findAll() {
    return `This action returns all ventaPagos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ventaPago`;
  }

  update(id: number, updateVentaPagoDto: UpdateVentaPagoDto) {
    return `This action updates a #${id} ventaPago`;
  }

  remove(id: number) {
    return `This action removes a #${id} ventaPago`;
  }
}

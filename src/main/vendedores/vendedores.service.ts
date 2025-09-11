import { Injectable } from '@nestjs/common';
import { CreateVendedorDto } from './dto/create-vendedor.dto';
import { UpdateVendedorDto } from './dto/update-vendedor.dto';

@Injectable()
export class VendedoresService {
  create(createVendedorDto: CreateVendedorDto) {
    return 'This action adds a new vendedore';
  }

  findAll() {
    return `This action returns all vendedores`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vendedore`;
  }

  update(id: number, updateVendedorDto: UpdateVendedorDto) {
    return `This action updates a #${id} vendedore`;
  }

  remove(id: number) {
    return `This action removes a #${id} vendedore`;
  }
}

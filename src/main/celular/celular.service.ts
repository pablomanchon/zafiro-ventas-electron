import { Injectable } from '@nestjs/common';
import { CreateCelularDto } from './dto/create-celular.dto';
import { UpdateCelularDto } from './dto/update-celular.dto';

@Injectable()
export class CelularService {
  create(createCelularDto: CreateCelularDto) {
    return 'This action adds a new celular';
  }

  findAll() {
    return `This action returns all celular`;
  }

  findOne(id: number) {
    return `This action returns a #${id} celular`;
  }

  update(id: number, updateCelularDto: UpdateCelularDto) {
    return `This action updates a #${id} celular`;
  }

  remove(id: number) {
    return `This action removes a #${id} celular`;
  }
}

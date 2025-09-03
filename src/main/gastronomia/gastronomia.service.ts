import { Injectable } from '@nestjs/common';
import { PlatoDto } from './dto/plato.dto';

@Injectable()
export class GastronomiaService {
  create(plato: PlatoDto ) {
    return 'This action adds a new Plato';
  }

  findAll() {
    return `This action returns all Plato`;
  }

  findOne(id: number) {
    return `This action returns a #${id} Plato`;
  }

  update(id: number, plato: PlatoDto) {
    return `This action updates a #${id} Plato`;
  }

  remove(id: number) {
    return `This action removes a #${id} Plato`;
  }
}

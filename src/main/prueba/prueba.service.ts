// src/prueba/prueba.service.ts
import { Injectable }         from '@nestjs/common';
import { PruebaRepository }   from './prueba.repository';
import { CreatePruebaDto }    from './dto/create-prueba.dto';
import { UpdatePruebaDto }    from './dto/update-prueba.dto';

@Injectable()
export class PruebaService {
  constructor(private readonly repo: PruebaRepository) {}

  create(createPruebaDto: CreatePruebaDto) {
    return this.repo.create(createPruebaDto);
  }

  findAll() {
    return this.repo.findAll();
  }

  findOne(id: number) {
    return this.repo.findOne(id);
  }

  update(id: number, updatePruebaDto: UpdatePruebaDto) {
    return this.repo.update(id, updatePruebaDto);
  }

  remove(id: number) {
    return this.repo.remove(id);
  }
}

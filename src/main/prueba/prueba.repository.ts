// src/prueba/prueba.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository }               from '@nestjs/typeorm';
import { Repository }                    from 'typeorm';
import { Prueba }                        from './entities/prueba.entity';
import { CreatePruebaDto }               from './dto/create-prueba.dto';
import { UpdatePruebaDto }               from './dto/update-prueba.dto';

@Injectable()
export class PruebaRepository {
  constructor(
    @InjectRepository(Prueba)
    private readonly repo: Repository<Prueba>,
  ) {}

  create(dto: CreatePruebaDto): Promise<Prueba> {
    const entity = this.repo.create({ ...dto, isDeleted: false });
    return this.repo.save(entity);
  }

  findAll(): Promise<Prueba[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Prueba> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Prueba ${id} not found`);
    return entity;
  }

  async update(id: number, dto: UpdatePruebaDto): Promise<Prueba> {
    const entity = await this.repo.preload({ id, ...dto });
    if (!entity) throw new NotFoundException(`Prueba ${id} not found`);
    return this.repo.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    // o si prefieres soft-delete:
    // entity.isDeleted = true;
    // await this.repo.save(entity);
  }
}

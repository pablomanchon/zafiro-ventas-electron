import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIngredienteDto } from './dto/create-ingrediente.dto';
import { UpdateIngredienteDto } from './dto/update-ingrediente.dto';
import { Ingrediente } from './entities/ingrediente.entity';

@Injectable()
export class IngredientesService {
  constructor(
    @InjectRepository(Ingrediente)
    private readonly ingredienteRepo: Repository<Ingrediente>,
  ) { }

  create(dto: CreateIngredienteDto) {
    const entity = this.ingredienteRepo.create(dto);
    return this.ingredienteRepo.save(entity);
  }

  findAll() {
    return this.ingredienteRepo.find();
  }

  async findOne(id: string) {
    const ingrediente = await this.ingredienteRepo.findOne({ where: { id } });
    if (!ingrediente) throw new NotFoundException('Ingrediente no encontrado');
    return ingrediente;
  }

  async update(id: string, dto: UpdateIngredienteDto) {
    await this.ingredienteRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const ingrediente = await this.findOne(id);
    await this.ingredienteRepo.remove(ingrediente);
    return { deleted: true };
  }
}

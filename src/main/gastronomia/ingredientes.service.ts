import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIngredienteDto } from './dto/create-ingrediente.dto';
import { UpdateIngredienteDto } from './dto/update-ingrediente.dto';
import { Ingrediente, isGoodMedida } from './entities/ingrediente.entity';

@Injectable()
export class IngredientesService {
  constructor(
    @InjectRepository(Ingrediente)
    private readonly ingredienteRepo: Repository<Ingrediente>,
  ) {}

  async create(dto: CreateIngredienteDto) {
    const existente = await this.ingredienteRepo.findOne({
      where: { nombre: dto.nombre },
    });

    if (!isGoodMedida(dto.unidadBase)) {
      throw new BadRequestException('La unidad de medida no es la correcta');
    }

    if (existente) {
      throw new ConflictException('La entidad ya existe');
    }

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

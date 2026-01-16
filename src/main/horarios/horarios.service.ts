import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Horario } from './entities/horario.entity';
import { Vendedor } from '../vendedores/entities/vendedor.entity';
import { CreateHorarioDto, MarcarEgresoDto } from './dto/create-horario.dto';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario) private readonly horariosRepo: Repository<Horario>,
    @InjectRepository(Vendedor) private readonly vendedoresRepo: Repository<Vendedor>,
  ) {}

  async crearIngreso(dto: CreateHorarioDto) {
    const vendedor = await this.vendedoresRepo.findOne({
      where: { id: dto.vendedorId, deleted: false },
    });
    if (!vendedor) throw new NotFoundException('Vendedor no encontrado');

    // (opcional) evitar doble ingreso abierto
    const abierto = await this.horariosRepo.findOne({
      where: { vendedor: { id: dto.vendedorId }, horaEgreso: IsNull() },
      order: { horaIngreso: 'DESC' },
    });
    if (abierto) throw new BadRequestException('Este vendedor ya tiene un horario abierto');

    const horario = this.horariosRepo.create({
      vendedor,
      horaIngreso: dto.horaIngreso ?? new Date(),
      horaEgreso: null,
    });

    return this.horariosRepo.save(horario);
  }

  async marcarEgreso(vendedorId: number, dto: MarcarEgresoDto) {
    const abierto = await this.horariosRepo.findOne({
      where: { vendedor: { id: vendedorId }, horaEgreso: IsNull() },
      order: { horaIngreso: 'DESC' },
    });
    if (!abierto) throw new NotFoundException('No hay un horario abierto para este vendedor');

    abierto.horaEgreso = dto.horaEgreso ?? new Date();
    if (abierto.horaEgreso < abierto.horaIngreso) {
      throw new BadRequestException('La hora de egreso no puede ser anterior al ingreso');
    }

    return this.horariosRepo.save(abierto);
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreatePlatoDto } from './dto/create-plato.dto';
import { UpdatePlatoDto } from './dto/update-plato.dto';
import { AjustarStockDto } from './dto/ajustar-stock.dto';
import { Ingrediente } from './entities/ingrediente.entity';
import { Plato } from './entities/plato.entity';
import { PlatoIngrediente } from './entities/plato-ingrediente.entity';
import { PlatoSubplato } from './entities/plato-subplato.entity';

@Injectable()
export class PlatosService {
  constructor(
    @InjectRepository(Plato)
    private readonly platoRepo: Repository<Plato>,
    @InjectRepository(Ingrediente)
    private readonly ingredienteRepo: Repository<Ingrediente>,
    @InjectRepository(PlatoIngrediente)
    private readonly platoIngredienteRepo: Repository<PlatoIngrediente>,
    @InjectRepository(PlatoSubplato)
    private readonly platoSubplatoRepo: Repository<PlatoSubplato>,
    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreatePlatoDto) {
    return this.dataSource.transaction(manager => this.upsertPlato(dto, manager));
  }

  async update(id: string, dto: UpdatePlatoDto) {
    const existing = await this.platoRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Plato no encontrado');
    return this.dataSource.transaction(manager => this.upsertPlato({ ...dto, id }, manager));
  }

  findAll() {
    return this.platoRepo.find();
  }

  async findOne(id: string) {
    const plato = await this.platoRepo.findOne({ where: { id } });
    if (!plato) throw new NotFoundException('Plato no encontrado');
    return plato;
  }

  async remove(id: string) {
    const plato = await this.findOne(id);
    await this.platoRepo.remove(plato);
    return { deleted: true };
  }

  private async upsertPlato(dto: CreatePlatoDto, manager: EntityManager) {
    const platoRepo = manager.getRepository(Plato);
    const ingredienteRepo = manager.getRepository(Ingrediente);
    const piRepo = manager.getRepository(PlatoIngrediente);
    const psRepo = manager.getRepository(PlatoSubplato);

    if (dto.id && dto.id.trim() === '') {
      throw new BadRequestException('El id del plato no puede ser vacío');
    }

    // Resetear receta previa en modo actualización para evitar basura histórica
    if (dto.id) {
      await piRepo.delete({ plato: { id: dto.id } as any });
      await psRepo.delete({ platoPadre: { id: dto.id } as any });
    }

    const ingredientes = await Promise.all(
      (dto.ingredientes ?? []).map(async ing => {
        const ingrediente = await ingredienteRepo.findOne({ where: { id: ing.ingredienteId } });
        if (!ingrediente) throw new NotFoundException(`Ingrediente ${ing.ingredienteId} no encontrado`);
        return piRepo.create({ ingrediente, cantidadUsada: Number(ing.cantidadUsada) });
      }),
    );

    const subplatos = await Promise.all(
      (dto.subplatos ?? []).map(async sp => {
        if (dto.id && dto.id === sp.platoHijoId) {
          throw new BadRequestException('Un plato no puede referenciarse a sí mismo');
        }
        const platoHijo = await platoRepo.findOne({ where: { id: sp.platoHijoId } });
        if (!platoHijo) throw new NotFoundException(`Subplato ${sp.platoHijoId} no encontrado`);
        return psRepo.create({ platoHijo, cantidadUsada: Number(sp.cantidadUsada) });
      }),
    );

    const baseDatos: Partial<Plato> = {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precio: Number(dto.precio),
      stock: Number(dto.stock),
    };

    // Se apoya en la herencia de TypeORM (ChildEntity) para guardar en la misma tabla Producto
    const plato = platoRepo.create({ ...baseDatos, ingredientes, subplatos });
    const saved = await platoRepo.save(plato);

    // recalcular costo inicial
    const costo = await this.calcularCostoPlato(saved.id, manager);
    saved.precioCosto = Number(costo.toFixed(2));
    return platoRepo.save(saved);
  }

  async recalcularCosto(id: string) {
    const plato = await this.platoRepo.findOne({ where: { id } });
    if (!plato) throw new NotFoundException('Plato no encontrado');

    const costo = await this.dataSource.transaction(manager => this.calcularCostoPlato(id, manager));
    plato.precioCosto = Number(costo.toFixed(2));
    return this.platoRepo.save(plato);
  }

  async ajustarStock(id: string, dto: AjustarStockDto) {
    const plato = await this.platoRepo.findOne({ where: { id } });
    if (!plato) throw new NotFoundException('Plato no encontrado');

    plato.stock = Number(plato.stock ?? 0) + Number(dto.cantidad);
    return this.platoRepo.save(plato);
  }

  async calcularCostoPlato(id: string, manager?: EntityManager, visitados = new Set<string>()): Promise<number> {
    // visitados previene ciclos (A -> B -> A). Si se detecta el mismo plato en la rama actual, se corta.
    if (visitados.has(id)) {
      throw new BadRequestException(`Se detectó un ciclo de subplatos con el plato ${id}`);
    }
    visitados.add(id);

    const platoRepo = manager ? manager.getRepository(Plato) : this.platoRepo;
    const plato = await platoRepo.findOne({
      where: { id },
      relations: ['ingredientes', 'ingredientes.ingrediente', 'subplatos', 'subplatos.platoHijo'],
    });
    if (!plato) throw new NotFoundException('Plato no encontrado');

    const costoIngredientes = (plato.ingredientes ?? []).reduce((acc, pi) => {
      const ing = pi.ingrediente;
      if (!ing) return acc;
      const unitario = Number(ing.precioCostoBase);
      const factor = Number(pi.cantidadUsada) / Number(ing.cantidadBase);
      return acc + unitario * factor;
    }, 0);

    let costoSubplatos = 0;
    for (const sp of plato.subplatos ?? []) {
      const costoHijo = await this.calcularCostoPlato(sp.platoHijo.id, manager, visitados);
      costoSubplatos += costoHijo * Number(sp.cantidadUsada);
    }

    visitados.delete(id);
    return costoIngredientes + costoSubplatos;
  }
}

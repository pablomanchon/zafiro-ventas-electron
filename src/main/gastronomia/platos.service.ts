// src/main/platos/platos.service.ts  (ajustá la ruta real)
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { AjustarStockDto } from './dto/ajustar-stock.dto'
import { CreatePlatoDto } from './dto/create-plato.dto'
import { UpdatePlatoDto } from './dto/update-plato.dto'
import { Ingrediente } from './entities/ingrediente.entity'
import { Plato } from './entities/plato.entity'
import { PlatoIngrediente } from './entities/plato-ingrediente.entity'
import { PlatoSubplato } from './entities/plato-subplato.entity'
import { Producto } from '../productos/entities/producto.entity'

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
  ) {}

  // ─────────────────────────────────────────────────────────────

  async create(dto: CreatePlatoDto) {
    return this.dataSource.transaction(async (manager) => {
      const platoRepo = manager.getRepository(Plato)
      const ingredienteRepo = manager.getRepository(Ingrediente)
      const piRepo = manager.getRepository(PlatoIngrediente)
      const psRepo = manager.getRepository(PlatoSubplato)
      const productoRepo = manager.getRepository(Producto)

      const codigo = dto.codigo?.toString().trim()
      if (!codigo) throw new BadRequestException('Debe indicar código para el plato')

      // codigo único global (tabla base producto)
      const existsCodigo = await productoRepo.exist({ where: { codigo } as any })
      if (existsCodigo) {
        throw new BadRequestException(`Ya existe un producto con código "${codigo}"`)
      }

      const ingredientes = await Promise.all(
        (dto.ingredientes ?? []).map(async (ing) => {
          const ingrediente = await ingredienteRepo.findOne({
            where: { id: ing.ingredienteId },
          })
          if (!ingrediente) {
            throw new NotFoundException(`Ingrediente ${ing.ingredienteId} no encontrado`)
          }
          return piRepo.create({
            ingrediente,
            cantidadUsada: Number(ing.cantidadUsada),
          })
        }),
      )

      const subplatos = await Promise.all(
        (dto.subplatos ?? []).map(async (sp) => {
          // en create no hay id del plato todavía, así que solo validamos existencia
          const platoHijo = await platoRepo.findOne({ where: { id: sp.platoHijoId } })
          if (!platoHijo) {
            throw new NotFoundException(`Subplato ${sp.platoHijoId} no encontrado`)
          }
          return psRepo.create({
            platoHijo,
            cantidadUsada: Number(sp.cantidadUsada),
          })
        }),
      )

      // ✅ CREATE: NO seteamos id
      const plato = platoRepo.create({
        codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? '',
        precio: dto.precio,
        stock: dto.stock,
        ingredientes,
        subplatos,
      })

      const saved = await platoRepo.save(plato)

      // recalcular costo y persistir sin reinsertar
      const costo = await this.calcularCostoPlato(saved.id, manager)
      await platoRepo.update(saved.id, { precioCosto: Number(costo.toFixed(2)) })

      return platoRepo.findOneOrFail({
        where: { id: saved.id },
        relations: [
          'ingredientes',
          'ingredientes.ingrediente',
          'subplatos',
          'subplatos.platoHijo',
        ],
      })
    })
  }

  // ─────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdatePlatoDto) {
    return this.dataSource.transaction(async (manager) => {
      const platoRepo = manager.getRepository(Plato)
      const ingredienteRepo = manager.getRepository(Ingrediente)
      const piRepo = manager.getRepository(PlatoIngrediente)
      const psRepo = manager.getRepository(PlatoSubplato)
      const productoRepo = manager.getRepository(Producto)

      const existing = await platoRepo.findOne({ where: { id } })
      if (!existing) throw new NotFoundException('Plato no encontrado')

      // resolver codigo final
      const codigoFinal = (dto.codigo ?? existing.codigo)?.toString().trim()
      if (!codigoFinal) throw new BadRequestException('Debe indicar código para el plato')

      // validar codigo único SOLO si cambia (y excluyendo el mismo id)
      if (codigoFinal !== existing.codigo) {
        const dup = await productoRepo
          .createQueryBuilder('p')
          .where('p.codigo = :codigo', { codigo: codigoFinal })
          .andWhere('p.id <> :id', { id })
          .getExists()

        if (dup) throw new BadRequestException(`Ya existe un producto con código "${codigoFinal}"`)
      }

      // borrar relaciones previas
      await piRepo.delete({ plato: { id } as any })
      await psRepo.delete({ platoPadre: { id } as any })

      // recrear relaciones
      const ingredientes = await Promise.all(
        (dto.ingredientes ?? []).map(async (ing) => {
          const ingrediente = await ingredienteRepo.findOne({
            where: { id: ing.ingredienteId },
          })
          if (!ingrediente) {
            throw new NotFoundException(`Ingrediente ${ing.ingredienteId} no encontrado`)
          }
          return piRepo.create({
            plato: { id } as any,
            ingrediente,
            cantidadUsada: Number(ing.cantidadUsada),
          })
        }),
      )
      if (ingredientes.length) await piRepo.save(ingredientes)

      const subplatos = await Promise.all(
        (dto.subplatos ?? []).map(async (sp) => {
          if (id === sp.platoHijoId) {
            throw new BadRequestException('Un plato no puede referenciarse a sí mismo')
          }
          const platoHijo = await platoRepo.findOne({ where: { id: sp.platoHijoId } })
          if (!platoHijo) {
            throw new NotFoundException(`Subplato ${sp.platoHijoId} no encontrado`)
          }
          return psRepo.create({
            platoPadre: { id } as any,
            platoHijo,
            cantidadUsada: Number(sp.cantidadUsada),
          })
        }),
      )
      if (subplatos.length) await psRepo.save(subplatos)

      // ✅ UPDATE REAL: NO save({id,...}) (evita INSERT/IDENTITY_INSERT)
      await platoRepo.update(id, {
        codigo: codigoFinal,
        nombre: dto.nombre ?? existing.nombre,
        descripcion: dto.descripcion ?? existing.descripcion,
        precio: dto.precio ?? existing.precio,
        stock: dto.stock ?? existing.stock,
      })

      const costo = await this.calcularCostoPlato(id, manager)
      await platoRepo.update(id, { precioCosto: Number(costo.toFixed(2)) })

      return platoRepo.findOneOrFail({
        where: { id },
        relations: [
          'ingredientes',
          'ingredientes.ingrediente',
          'subplatos',
          'subplatos.platoHijo',
        ],
      })
    })
  }

  // ─────────────────────────────────────────────────────────────

  findAll() {
    return this.platoRepo.find({
      relations: [
        'ingredientes',
        'ingredientes.ingrediente',
        'subplatos',
        'subplatos.platoHijo',
      ],
    })
  }

  async findOne(id: number) {
    const plato = await this.platoRepo.findOne({
      where: { id },
      relations: [
        'ingredientes',
        'ingredientes.ingrediente',
        'subplatos',
        'subplatos.platoHijo',
      ],
    })
    if (!plato) throw new NotFoundException('Plato no encontrado')
    return plato
  }

  async remove(id: number) {
    const plato = await this.findOne(id)
    await this.platoRepo.remove(plato)
    return { deleted: true }
  }

  async recalcularCosto(id: number) {
    const plato = await this.platoRepo.findOne({ where: { id } })
    if (!plato) throw new NotFoundException('Plato no encontrado')

    const costo = await this.dataSource.transaction((manager) =>
      this.calcularCostoPlato(id, manager),
    )
    plato.precioCosto = Number(costo.toFixed(2))
    return this.platoRepo.save(plato)
  }

  async ajustarStock(id: number, dto: AjustarStockDto) {
    const plato = await this.platoRepo.findOne({ where: { id } })
    if (!plato) throw new NotFoundException('Plato no encontrado')

    plato.stock = Number(plato.stock ?? 0) + Number(dto.cantidad)
    return this.platoRepo.save(plato)
  }

  // ─────────────────────────────────────────────────────────────

  async calcularCostoPlato(
    id: number,
    manager?: EntityManager,
    visitados = new Set<number>(),
  ): Promise<number> {
    if (visitados.has(id)) {
      throw new BadRequestException(`Se detectó un ciclo de subplatos con el plato ${id}`)
    }
    visitados.add(id)

    const platoRepo = manager ? manager.getRepository(Plato) : this.platoRepo

    const plato = await platoRepo.findOne({
      where: { id },
      relations: [
        'ingredientes',
        'ingredientes.ingrediente',
        'subplatos',
        'subplatos.platoHijo',
      ],
    })
    if (!plato) throw new NotFoundException('Plato no encontrado')

    const costoIngredientes = (plato.ingredientes ?? []).reduce((acc, pi) => {
      const ing = pi.ingrediente
      if (!ing) return acc
      const unitario = Number(ing.precioCostoBase)
      const factor = Number(pi.cantidadUsada) / Number(ing.cantidadBase)
      return acc + unitario * factor
    }, 0)

    let costoSubplatos = 0
    for (const sp of plato.subplatos ?? []) {
      const costoHijo = await this.calcularCostoPlato(sp.platoHijo.id, manager, visitados)
      costoSubplatos += costoHijo * Number(sp.cantidadUsada)
    }

    visitados.delete(id)
    return costoIngredientes + costoSubplatos
  }
}

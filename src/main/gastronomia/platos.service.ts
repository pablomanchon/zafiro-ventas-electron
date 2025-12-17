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
import { Producto } from '../productos/entities/producto.entity' // <-- ajustá la ruta si difiere

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

  async create(dto: CreatePlatoDto) {
    return this.dataSource.transaction((manager) =>
      this.upsertPlato(dto, manager, { mode: 'create' }),
    )
  }

  async update(id: string, dto: UpdatePlatoDto) {
    // Spread => objeto plano, por eso NO usamos instanceof
    return this.dataSource.transaction((manager) =>
      this.upsertPlato({ ...dto, id }, manager, { mode: 'update' }),
    )
  }

  findAll() {
    return this.platoRepo.find()
  }

  async findOne(id: string) {
    const plato = await this.platoRepo.findOne({ where: { id } })
    if (!plato) throw new NotFoundException('Plato no encontrado')
    return plato
  }

  async remove(id: string) {
    const plato = await this.findOne(id)
    await this.platoRepo.remove(plato)
    return { deleted: true }
  }

  async recalcularCosto(id: string) {
    const plato = await this.platoRepo.findOne({ where: { id } })
    if (!plato) throw new NotFoundException('Plato no encontrado')

    const costo = await this.dataSource.transaction((manager) =>
      this.calcularCostoPlato(id, manager),
    )
    plato.precioCosto = Number(costo.toFixed(2))
    return this.platoRepo.save(plato)
  }

  async ajustarStock(id: string, dto: AjustarStockDto) {
    const plato = await this.platoRepo.findOne({ where: { id } })
    if (!plato) throw new NotFoundException('Plato no encontrado')

    plato.stock = Number(plato.stock ?? 0) + Number(dto.cantidad)
    return this.platoRepo.save(plato)
  }

  private async upsertPlato(
    dto: CreatePlatoDto | UpdatePlatoDto,
    manager: EntityManager,
    opts: { mode: 'create' | 'update' },
  ) {
    const platoRepo = manager.getRepository(Plato)
    const ingredienteRepo = manager.getRepository(Ingrediente)
    const piRepo = manager.getRepository(PlatoIngrediente)
    const psRepo = manager.getRepository(PlatoSubplato)

    // ⚠️ IMPORTANTÍSIMO con TableInheritance:
    // la PK vive en la tabla base (producto). Si existe un id en OTRO "tipo",
    // repo(Plato) NO lo ve, pero igual explota por PK duplicada.
    const productoRepo = manager.getRepository(Producto)

    if (!dto.id || dto.id.trim() === '') {
      throw new BadRequestException('El id del plato no puede estar vacío')
    }

    // Existencia “real” (en la tabla base)
    const existsAnyTipo = await productoRepo.exist({ where: { id: dto.id } })

    // Existencia “como PLATO” (por si necesitás usar existing para defaults/borrado relaciones)
    const existingPlato = await platoRepo.findOne({ where: { id: dto.id } })

    if (opts.mode === 'create') {
      dto.codigo = dto.id;
      if (existsAnyTipo) {
        // Puede existir como otro tipo (Producto/Servicio/etc) o como Plato.
        throw new BadRequestException(`Ya existe un producto con id ${dto.id}`)
      }
    } else {
      // update
      if (!existingPlato) {
        // Si no existe como PLATO, no permitimos “convertir” otro tipo a PLATO por accidente
        throw new NotFoundException('Plato no encontrado')
      }
    }

    // Si estamos actualizando, borrar relaciones previas
    if (existingPlato) {
      await piRepo.delete({ plato: { id: dto.id } as any })
      await psRepo.delete({ platoPadre: { id: dto.id } as any })
    }

    const ingredientes = await Promise.all(
      (dto.ingredientes ?? []).map(async (ing) => {
        const ingrediente = await ingredienteRepo.findOne({
          where: { id: ing.ingredienteId },
        })
        if (!ingrediente) {
          throw new NotFoundException(
            `Ingrediente ${ing.ingredienteId} no encontrado`,
          )
        }
        return piRepo.create({
          ingrediente,
          cantidadUsada: Number(ing.cantidadUsada),
        })
      }),
    )

    const subplatos = await Promise.all(
      (dto.subplatos ?? []).map(async (sp) => {
        if (dto.id === sp.platoHijoId) {
          throw new BadRequestException(
            'Un plato no puede referenciarse a sí mismo',
          )
        }

        // Si tus PLATOS son ChildEntity en la misma tabla base,
        // esto busca solo tipo PLATO. Si querés permitir subplatos de otros tipos,
        // cambiá a productoRepo.
        const platoHijo = await platoRepo.findOne({
          where: { id: sp.platoHijoId },
        })

        if (!platoHijo) {
          throw new NotFoundException(
            `Subplato ${sp.platoHijoId} no encontrado`,
          )
        }

        return psRepo.create({
          platoHijo,
          cantidadUsada: Number(sp.cantidadUsada),
        })
      }),
    )

    const plato = platoRepo.create({
      id: dto.id,
      nombre: dto.nombre ?? existingPlato?.nombre,
      descripcion: dto.descripcion ?? existingPlato?.descripcion,
      precio: dto.precio ?? existingPlato?.precio,
      stock: dto.stock ?? existingPlato?.stock,
      ingredientes,
      subplatos,
    })

    try {
      const saved = await platoRepo.save(plato)

      // Recalcular costo dentro de la misma transacción
      const costo = await this.calcularCostoPlato(saved.id, manager)
      saved.precioCosto = Number(costo.toFixed(2))

      return platoRepo.save(saved)
    } catch (e: any) {
      // SQL Server: 2627 = PK dup, 2601 = unique index dup
      const num = e?.driverError?.number
      if (num === 2627 || num === 2601) {
        throw new BadRequestException(`Ya existe un producto con id ${dto.id}`)
      }
      throw e
    }
  }

  async calcularCostoPlato(
    id: string,
    manager?: EntityManager,
    visitados = new Set<string>(),
  ): Promise<number> {
    // previene ciclos (A -> B -> A)
    if (visitados.has(id)) {
      throw new BadRequestException(
        `Se detectó un ciclo de subplatos con el plato ${id}`,
      )
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
      const costoHijo = await this.calcularCostoPlato(
        sp.platoHijo.id,
        manager,
        visitados,
      )
      costoSubplatos += costoHijo * Number(sp.cantidadUsada)
    }

    visitados.delete(id)
    return costoIngredientes + costoSubplatos
  }
}

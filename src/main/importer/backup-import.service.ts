// src/importer/backup-import.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";

import { Producto } from "../productos/entities/producto.entity";
import { MovimientoStock } from "../movimiento-stock/entities/movimiento-stock.entity";
import { Caja } from "../caja/entities/caja.entity";
import { CajaMoveDetail } from "../caja/entities/cajaMove.entity";
import { MetodoPago } from "../metodo-pago/entities/metodo-pago.entity";
import { Vendedor } from "../vendedores/entities/vendedor.entity";
import { Horario } from "../horarios/entities/horario.entity";

import { Ingrediente, UnidadMedidaIngrediente } from "../gastronomia/entities/ingrediente.entity";
import { Plato } from "../gastronomia/entities/plato.entity";
import { PlatoIngrediente } from "../gastronomia/entities/plato-ingrediente.entity";
import { PlatoSubplato } from "../gastronomia/entities/plato-subplato.entity";

import { Cliente } from "../clientes/entities/cliente.entity";            // ✅ NUEVO
import { Venta } from "../ventas/entities/venta.entity";                  // ✅ NUEVO
import { BackupReader } from "./backup-reader.service";
import { MovimientoStockService } from "../movimiento-stock/movimiento-stock.service";
import { VentaDetalle } from "../venta-detalle/entities/venta-detalle.entity";
import { VentaPago } from "../venta-pagos/entities/venta-pago.entity";
import { ItemVenta } from "../item-venta/entities/item-venta.entity";

type JsonCash = { ars?: number; usd?: number; ARS?: number; USD?: number };

type JsonCajaMove = {
  id: string;
  detail?: string;
  amount: number;
  type: "In" | "Out" | string;
  date?: number; // ms
  usd?: boolean;
  saleId?: string;
};

type JsonSeller = { id: string; name: string };

type JsonSchedule = {
  id: string;
  seller?: { id: string; name: string } | null;
  isCompleted?: boolean;
  startTime?: number[]; // [yyyy, m, d, h, min]
  endTime?: number[];   // [yyyy, m, d, h, min]
};

// ✅ Sale completo (necesario para importar ventas)
type JsonSale = {
  Id: string;
  Date: number;
  Seller?: { id: string; name: string } | null;
  Detail?: string | null;

  Products?: Array<{
    Id: string;
    Name: string;
    Price: number | null;
    Stock: number; // cantidad
    priceWithDiscount?: number;
  }>;

  PaymentMethods?: Array<{
    id: string;
    descripcion: string;
    type: string;
    price?: number;
    quotes?: number | null;
  }>;
};

type JsonIngredient = {
  id: string;
  name: string;
  priceCost: number;
  exentType: string; // "gramos" | "mililitros" | "unidad"
  quantity: number;
};

type JsonPlate = {
  id: string;
  name: string;
  price?: number;
  stock?: number;

  ingredients?: Array<{
    ingredientId?: string;
    ingredient?: { id: string };
    quantity?: number;
    cantidad?: number;
  }>;

  subPlates?: Array<{
    plateId?: string;
    plate?: { id: string };
    quantity?: number;
    cantidad?: number;
  }>;
};

@Injectable()
export class BackupImportService {
  constructor(
    @InjectRepository(Caja) private cajaRepo: Repository<Caja>,
    @InjectRepository(CajaMoveDetail) private cajaMoveRepo: Repository<CajaMoveDetail>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
    @InjectRepository(MovimientoStock) private movStockRepo: Repository<MovimientoStock>,
    @InjectRepository(MetodoPago) private metodoPagoRepo: Repository<MetodoPago>,
    @InjectRepository(Vendedor) private vendedorRepo: Repository<Vendedor>,
    @InjectRepository(Horario) private horarioRepo: Repository<Horario>,

    @InjectRepository(Ingrediente) private ingredienteRepo: Repository<Ingrediente>,
    @InjectRepository(Plato) private platoRepo: Repository<Plato>,
    @InjectRepository(PlatoIngrediente) private platoIngredienteRepo: Repository<PlatoIngrediente>,
    @InjectRepository(PlatoSubplato) private platoSubplatoRepo: Repository<PlatoSubplato>,

    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,        // ✅ NUEVO
    @InjectRepository(Venta) private ventaRepo: Repository<Venta>,             // ✅ NUEVO
    @InjectRepository(VentaDetalle) private ventaDetalleRepo: Repository<VentaDetalle>, // ✅ NUEVO
    @InjectRepository(VentaPago) private ventaPagoRepo: Repository<VentaPago>, // ✅ NUEVO
    @InjectRepository(ItemVenta) private itemVentaRepo: Repository<ItemVenta>, // ✅ NUEVO

    private readonly movimientoStockService: MovimientoStockService,
  ) {}

  async importAll(baseDir: string) {
    const reader = new BackupReader(baseDir);

    await this.importCaja(reader);
    await this.importCajaMoves(reader);

    await this.importVendedores(reader);
    await this.importHorarios(reader);

    await this.importIngredientes(reader);
    await this.importPlatos(reader);

    await this.importProductos(reader);
    await this.importMovimientosStock(reader);

    // ✅ Importar métodos antes de ventas (ventas referencian métodos)
    await this.importMetodosPago(reader);
    await this.importVentas(reader);

    return { ok: true };
  }

  private async importCaja(reader: BackupReader) {
    const cash = reader.readJson<JsonCash>("Cash.json", {});
    const ars = (cash.ars ?? cash.ARS ?? 0);
    const usd = (cash.usd ?? cash.USD ?? 0);

    const caja = await this.cajaRepo.findOne({ where: { id: "main" } });
    const entity = caja ?? this.cajaRepo.create({ id: "main" });

    entity.saldoPesos = Number(ars).toFixed(2);
    entity.saldoUSD = Number(usd).toFixed(2);

    await this.cajaRepo.save(entity);
  }

  private async importCajaMoves(reader: BackupReader) {
    const moves = reader.readJson<JsonCajaMove[]>("CashMove.json", []);

    const entities = moves.map((m) => {
      const e = this.cajaMoveRepo.create();
      e.moveType = reader.normMoveType(m.type);
      const amount = Number(m.amount ?? 0);

      if (m.usd) {
        e.saldoUSD = amount.toFixed(2);
        e.saldoPesos = "0.00";
      } else {
        e.saldoPesos = amount.toFixed(2);
        e.saldoUSD = "0.00";
      }
      return e;
    });

    if (entities.length) await this.cajaMoveRepo.save(entities);
  }

  private async importVendedores(reader: BackupReader) {
    const sellers = reader.readJson<JsonSeller[]>("Sellers.json", []);

    const values = sellers
      .map((s) => ({
        id: normalizeSellerId(s.id),
        nombre: String(s.name ?? "").trim(),
        deleted: false,
      }))
      .filter((v) => Number.isFinite(v.id) && v.nombre);

    if (!values.length) return;

    await this.vendedorRepo
      .createQueryBuilder()
      .insert()
      .into("vendedor")
      .values(values)
      .orUpdate(["nombre", "deleted"], ["id"])
      .execute();
  }

  private async importHorarios(reader: BackupReader) {
    const schedules = reader.readJson<JsonSchedule[]>("Schedules.json", []);
    if (!schedules.length) return;

    const vendedorIds = Array.from(
      new Set(
        schedules
          .map((s) => s.seller?.id)
          .filter(Boolean)
          .map((id) => normalizeSellerId(String(id)))
      )
    );

    const vendedores = vendedorIds.length
      ? await this.vendedorRepo.find({ where: { id: In(vendedorIds), deleted: false } as any })
      : [];

    const byId = new Map(vendedores.map((v) => [v.id, v]));

    const entities: Horario[] = [];

    for (const s of schedules) {
      const horaIngreso = dateFromParts(s.startTime);
      if (!horaIngreso) continue;

      const horaEgreso = dateFromParts(s.endTime) ?? null;

      let vendedor: Vendedor | null = null;
      if (s.seller?.id) {
        const vid = normalizeSellerId(String(s.seller.id));
        vendedor = byId.get(vid) ?? null;
      }

      const h = this.horarioRepo.create({
        horaIngreso,
        horaEgreso,
        vendedor,
      });

      entities.push(h);
    }

    if (!entities.length) return;

    await this.horarioRepo.clear();
    await this.horarioRepo.save(entities);
  }

  private async importIngredientes(reader: BackupReader) {
    const ingredients = reader.readJson<JsonIngredient[]>("Ingredients.json", []);

    const values = ingredients
      .map((i) => ({
        codigo: String(i.id ?? "").trim(),
        nombre: String(i.name ?? "").trim(),
        unidadBase: mapUnidad(i.exentType),
        cantidadBase: toNum(i.quantity, 1),
        precioCostoBase: toNum(i.priceCost, 0),
        deleted: false,
      }))
      .filter((v) => v.codigo && v.nombre);

    if (!values.length) return;

    await this.ingredienteRepo
      .createQueryBuilder()
      .insert()
      .into("ingredientes")
      .values(values)
      .orUpdate(["nombre", "unidadBase", "cantidadBase", "precioCostoBase", "deleted"], ["codigo"])
      .execute();
  }

  private async importPlatos(reader: BackupReader) {
    const plates = reader.readJson<JsonPlate[]>("Plates.json", []);
    if (!plates.length) return;

    const values = plates
      .map((p) => ({
        codigo: String(p.id ?? "").trim(),
        nombre: String(p.name ?? "").trim(),
        precio: toNum(p.price, 0),
        stock: toNum(p.stock, 0),
        deleted: false,
        tipo: "PLATO",
        precioCosto: 0,
      }))
      .filter((v) => v.codigo && v.nombre);

    if (values.length) {
      await this.platoRepo
        .createQueryBuilder()
        .insert()
        .into("producto") // STI
        .values(values as any)
        .orUpdate(["nombre", "precio", "stock", "deleted", "precioCosto", "tipo"], ["codigo"])
        .execute();
    }

    await this.importRelacionesPlato(plates);
  }

  private async importRelacionesPlato(plates: JsonPlate[]) {
    const hasAny =
      plates.some((p) => (p.ingredients?.length ?? 0) > 0) ||
      plates.some((p) => (p.subPlates?.length ?? 0) > 0);

    if (!hasAny) return;

    await this.platoIngredienteRepo.clear();
    await this.platoSubplatoRepo.clear();

    const plateCodigos = plates.map((p) => String(p.id ?? "").trim()).filter(Boolean);
    const platosDb = await this.platoRepo.find({ where: { codigo: In(plateCodigos) } as any });
    const platosByCodigo = new Map(platosDb.map((p) => [p.codigo, p]));

    const ingCodigos = new Set<string>();
    for (const p of plates) {
      for (const it of (p.ingredients ?? [])) {
        const codigo = String(it.ingredientId ?? it.ingredient?.id ?? "").trim();
        if (codigo) ingCodigos.add(codigo);
      }
    }

    const ingredientesDb = ingCodigos.size
      ? await this.ingredienteRepo.find({ where: { codigo: In([...ingCodigos]) } as any })
      : [];
    const ingByCodigo = new Map(ingredientesDb.map((i) => [i.codigo, i]));

    const piRows: any[] = [];
    for (const p of plates) {
      const plato = platosByCodigo.get(String(p.id ?? "").trim());
      if (!plato) continue;

      for (const it of (p.ingredients ?? [])) {
        const ingCodigo = String(it.ingredientId ?? it.ingredient?.id ?? "").trim();
        const ing = ingByCodigo.get(ingCodigo);
        if (!ing) continue;

        const qty = toNum(it.quantity ?? it.cantidad, 0);
        if (qty <= 0) continue;

        piRows.push({ platoId: plato.id, ingredienteId: ing.id, cantidadUsada: qty });
      }
    }

    if (piRows.length) {
      await this.platoIngredienteRepo
        .createQueryBuilder()
        .insert()
        .into("platos_ingredientes")
        .values(piRows)
        .execute();
    }

    const spRows: any[] = [];
    for (const p of plates) {
      const padre = platosByCodigo.get(String(p.id ?? "").trim());
      if (!padre) continue;

      for (const it of (p.subPlates ?? [])) {
        const hijoCodigo = String(it.plateId ?? it.plate?.id ?? "").trim();
        const hijo = platosByCodigo.get(hijoCodigo);
        if (!hijo) continue;

        const qty = toNum(it.quantity ?? it.cantidad, 0);
        if (qty <= 0) continue;

        spRows.push({ platoPadreId: padre.id, platoHijoId: hijo.id, cantidadUsada: qty });
      }
    }

    if (spRows.length) {
      await this.platoSubplatoRepo
        .createQueryBuilder()
        .insert()
        .into("platos_subplatos")
        .values(spRows)
        .execute();
    }
  }

  private async importProductos(reader: BackupReader) {
    const products = reader.readJson<any[]>("Products.json", []);

    const values = products
      .map((p) => ({
        codigo: String(p.Id ?? "").trim(),
        nombre: String(p.Name ?? "").trim(),
        precio: Number(p.Price ?? 0),
        stock: Number(p.Stock ?? 0),
        deleted: false,
        precioCosto: 0,
        tipo: "Producto",
      }))
      .filter((v) => v.codigo);

    if (!values.length) return;

    await this.productoRepo
      .createQueryBuilder()
      .insert()
      .into("producto")
      .values(values)
      .orUpdate(["nombre", "precio", "stock", "deleted", "precioCosto", "tipo"], ["codigo"])
      .execute();
  }

  private async importMovimientosStock(reader: BackupReader) {
    const moves = reader.readJson<any[]>("MoveStock.json", []);

    const faltantes = new Set<string>();

    for (const m of moves) {
      const moveType = reader.normMoveType(m.type);

      const productsDto = (m.products ?? [])
        .map((p: any) => ({
          idProduct: String(p.Id ?? "").trim(),
          quantity: Number(p.Stock ?? 0),
        }))
        .filter((x: any) => x.idProduct && x.quantity > 0);

      if (!productsDto.length) continue;

      try {
        const result = await this.movimientoStockService.create({
          moveType,
          products: productsDto,
        } as any);

        const fecha = reader.toDateFromMs(m.date);
        if (fecha && result?.movimientoId) {
          await this.movStockRepo.update({ id: result.movimientoId }, { fecha });
        }
      } catch (err: any) {
        const msg = String(err?.message ?? "");
        const match = msg.match(/Producto código "([^"]+)"/);
        if (match?.[1]) faltantes.add(match[1]);
        continue;
      }
    }

    return { faltantes: [...faltantes] };
  }

  private async importMetodosPago(reader: BackupReader) {
    const sales = reader.readJson<JsonSale[]>("Sales.json", []);

    const uniq = new Map<string, { id: string; nombre: string; tipo: MetodoPago["tipo"] }>();

    for (const s of sales) {
      for (const pm of (s.PaymentMethods ?? [])) {
        const id = String(pm.id).trim();
        if (!id) continue;
        if (uniq.has(id)) continue;

        uniq.set(id, {
          id,
          nombre: String(pm.descripcion ?? id).trim() || id,
          tipo: reader.normMetodoPagoTipo(pm.type),
        });
      }
    }

    const ids = [...uniq.keys()];
    if (!ids.length) return;

    const existentes = await this.metodoPagoRepo.find({ where: { id: In(ids) } });
    const existSet = new Set(existentes.map((x) => x.id));

    const nuevos = ids
      .filter((id) => !existSet.has(id))
      .map((id) => this.metodoPagoRepo.create({ ...uniq.get(id)!, deleted: false }));

    if (nuevos.length) await this.metodoPagoRepo.save(nuevos);
  }

  // ✅ NUEVO: Ventas desde Sales.json
  private async getOrCreateConsumidorFinal() {
    let c = await this.clienteRepo.findOne({ where: { nombre: "Consumidor Final" } as any });
    if (!c) {
      c = this.clienteRepo.create({ nombre: "Consumidor Final", deleted: false });
      c = await this.clienteRepo.save(c);
    }
    return c;
  }

  private async importVentas(reader: BackupReader) {
    const sales = reader.readJson<JsonSale[]>("Sales.json", []);
    if (!sales.length) return;

    const consumidorFinal = await this.getOrCreateConsumidorFinal();

    // vendedores (batch)
    const vendedorIds = Array.from(
      new Set(
        sales
          .map((s) => s.Seller?.id)
          .filter(Boolean)
          .map((id) => normalizeSellerId(String(id)))
      )
    );

    const vendedores = vendedorIds.length
      ? await this.vendedorRepo.find({ where: { id: In(vendedorIds), deleted: false } as any })
      : [];
    const byVendedor = new Map(vendedores.map((v) => [v.id, v]));

    // productos (batch, por codigo)
    const prodCodigos = Array.from(
      new Set(
        sales
          .flatMap((s) => s.Products ?? [])
          .map((p) => String(p.Id ?? "").trim())
          .filter(Boolean)
      )
    );

    const productos = prodCodigos.length
      ? await this.productoRepo.find({ where: { codigo: In(prodCodigos), deleted: false } })
      : [];
    const byProductoCodigo = new Map(productos.map((p) => [p.codigo, p]));

    // metodos de pago (batch)
    const metodoIds = Array.from(
      new Set(
        sales
          .flatMap((s) => s.PaymentMethods ?? [])
          .map((pm) => String(pm.id ?? "").trim())
          .filter(Boolean)
      )
    );

    const metodos = metodoIds.length
      ? await this.metodoPagoRepo.find({ where: { id: In(metodoIds) } })
      : [];
    const byMetodo = new Map(metodos.map((m) => [m.id, m]));

    for (const s of sales) {
      const fecha = reader.toDateFromMs(s.Date) ?? new Date();

      const vendedor =
        s.Seller?.id ? byVendedor.get(normalizeSellerId(String(s.Seller.id))) ?? null : null;

      // agrupar productos por codigo (en backup se repiten)
      const grouped = new Map<string, { codigo: string; nombre: string; precio: number; cantidad: number }>();

      for (const p of (s.Products ?? [])) {
        const codigo = String(p.Id ?? "").trim();
        if (!codigo) continue;

        const cantidad = Number(p.Stock ?? 0);
        if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

        const precio = Number(p.priceWithDiscount ?? p.Price ?? 0);
        const nombre = String(p.Name ?? codigo).trim() || codigo;

        const prev = grouped.get(codigo);
        if (!prev) grouped.set(codigo, { codigo, nombre, precio, cantidad });
        else prev.cantidad += cantidad;
      }

      const detalles: any[] = [];
      for (const it of grouped.values()) {
        const producto = byProductoCodigo.get(it.codigo) ?? null;

        const item = this.itemVentaRepo.create({
          producto,
          codigo: it.codigo,
          nombre: it.nombre,
          precio: it.precio,
          cantidad: it.cantidad,
        } as any);

        detalles.push({ item });
      }

      const venta = this.ventaRepo.create({
        fecha,
        cliente: consumidorFinal,
        vendedor,
        detalles,
        deleted: false,
        total: 0,
      } as any);

      const savedVenta = await this.ventaRepo.save(venta);
      const ventaId = Array.isArray(savedVenta) ? (savedVenta[0] as any)?.id : (savedVenta as any).id;

      // Save pagos separately after venta is created
      for (const pm of (s.PaymentMethods ?? [])) {
        const metodo = byMetodo.get(String(pm.id ?? "").trim());
        if (!metodo) continue;

        const monto = Number(pm.price ?? 0);
        if (!Number.isFinite(monto) || monto <= 0) continue;

        const pago = this.ventaPagoRepo.create({
          venta: { id: ventaId } as any,
          metodo,
          monto,
          cuotas: pm.quotes ?? null,
        } as any);

        await this.ventaPagoRepo.save(pago);
      }
    }
  }
}

function normalizeSellerId(raw: string): number {
  const s = String(raw).trim().toUpperCase();
  let out = "";
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch >= "A" && ch <= "Z") out += (ch.charCodeAt(0) - 64).toString();
  }
  if (!out) throw new Error(`ID de vendedor inválido: "${raw}"`);
  const n = Number(out);
  if (!Number.isFinite(n)) throw new Error(`ID de vendedor fuera de rango: "${raw}" -> "${out}"`);
  return n;
}

function dateFromParts(parts?: number[] | null): Date | undefined {
  if (!parts || parts.length < 5) return undefined;
  const [y, m, d, h, min] = parts;
  if (![y, m, d, h, min].every((n) => Number.isFinite(n))) return undefined;
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapUnidad(exentType?: string | null): UnidadMedidaIngrediente {
  const x = String(exentType ?? "").trim().toLowerCase();
  if (x.includes("gram")) return UnidadMedidaIngrediente.GRAMOS;
  if (x.includes("mili") || x === "ml") return UnidadMedidaIngrediente.MILILITROS;
  return UnidadMedidaIngrediente.UNIDAD;
}

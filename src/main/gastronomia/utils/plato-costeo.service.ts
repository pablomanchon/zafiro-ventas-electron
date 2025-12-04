// platos/platos-costeo.service.ts
import { Injectable } from '@nestjs/common';
import { Plato } from '../entities/plato.entity';
import { PlatoIngrediente } from '../entities/plato-ingrediente.entity';
import { UnidadMedidaIngrediente } from '../entities/ingrediente.entity';

@Injectable()
export class PlatosCosteoService {
  costoDePlato(plato: Plato): number {
    if (!plato.ingredientes?.length) return 0;

    let total = 0;
    for (const pi of plato.ingredientes as PlatoIngrediente[]) {
      const ing = pi.ingrediente;

      if (ing.unidadBase !== UnidadMedidaIngrediente.UNIDAD &&
          ing.unidadBase !== UnidadMedidaIngrediente.GRAMOS &&
          ing.unidadBase !== UnidadMedidaIngrediente.MILILITROS) {
        throw new Error(`Unidad de medida inválida para ${ing.nombre}: ${ing.unidadBase}`);
      }

      const cantidadBase = Number(ing.cantidadBase);
      if (!cantidadBase) {
        throw new Error(`Cantidad base inválida para ${ing.nombre}: ${ing.cantidadBase}`);
      }

      const proporcionUsada = Number(pi.cantidadUsada) / cantidadBase;
      const costoIngrediente = Number(ing.precioCostoBase) * proporcionUsada;
      total += costoIngrediente;
    }
    return Math.round(total * 100) / 100; // 2 decimales
  }

  // opcional: sugerir precio con markup, p.ej. 180% => x2.8
  precioSugerido(plato: Plato, markup = 1.8): number {
    const costo = this.costoDePlato(plato);
    return Math.round((costo * (1 + markup)) * 100) / 100;
  }
}

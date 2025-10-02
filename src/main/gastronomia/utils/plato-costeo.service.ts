// platos/platos-costeo.service.ts
import { Injectable } from '@nestjs/common';
import { Plato } from '../entities/plato.entity';
import { PlatoIngrediente } from '../entities/plato-ingrediente.entity';
import { UnidadMedida } from '../entities/ingrediente.entity';

@Injectable()
export class PlatosCosteoService {
  costoDePlato(plato: Plato): number {
    if (!plato.ingredientes?.length) return 0;

    let total = 0;
    for (const pi of plato.ingredientes as PlatoIngrediente[]) {
      const ing = pi.ingrediente;

      // Validación simple: U con U (para tu caso)
      if (pi.unidad !== UnidadMedida.U || ing.unidadCompra !== UnidadMedida.U) {
        throw new Error(`Unidades no compatibles para ${ing.nombre}: ${pi.unidad} vs ${ing.unidadCompra}`);
      }

      const costoUnitario = Number(ing.precioPaquete) / Number(ing.cantidadPorPaquete); // $ por unidad
      total += Number(pi.cantidad) * costoUnitario;
    }
    return Math.round(total * 100) / 100; // 2 decimales
  }

  // opcional: sugerir precio con markup, p.ej. 180% => x2.8
  precioSugerido(plato: Plato, markup = 1.8): number {
    const costo = this.costoDePlato(plato);
    return Math.round((costo * (1 + markup)) * 100) / 100;
  }
}

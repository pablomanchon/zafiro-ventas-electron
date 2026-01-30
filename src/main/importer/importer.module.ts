import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { BackupImportService } from './backup-import.service'

import { Producto } from '../productos/entities/producto.entity'
import { MovimientoStock } from '../movimiento-stock/entities/movimiento-stock.entity'
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity'
import { Caja } from '../caja/entities/caja.entity'
import { CajaMoveDetail } from '../caja/entities/cajaMove.entity'
import { MovimientoStockService } from '../movimiento-stock/movimiento-stock.service'
import { Vendedor } from '../vendedores/entities/vendedor.entity'
import { Horario } from '../horarios/entities/horario.entity'
import { Ingrediente } from '../gastronomia/entities/ingrediente.entity'
import { Plato } from '../gastronomia/entities/plato.entity'
import { PlatoIngrediente } from '../gastronomia/entities/plato-ingrediente.entity'
import { PlatoSubplato } from '../gastronomia/entities/plato-subplato.entity'
import { Cliente } from '../clientes/entities/cliente.entity'
import { Venta } from '../ventas/entities/venta.entity'
import { VentaDetalle } from '../venta-detalle/entities/venta-detalle.entity'
import { VentaPago } from '../venta-pagos/entities/venta-pago.entity'
import { ItemVenta } from '../item-venta/entities/item-venta.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Caja,
      CajaMoveDetail,
      Producto,
      MovimientoStock,
      MetodoPago,
      Vendedor,
      Horario,
      Ingrediente,
      Plato,
      PlatoIngrediente,
      PlatoSubplato,
      Cliente,
      Venta,
      VentaDetalle,
      VentaPago,
      ItemVenta,
    ]),
  ],
  providers: [BackupImportService, MovimientoStockService],
  exports: [BackupImportService],
})
export class ImporterModule {}
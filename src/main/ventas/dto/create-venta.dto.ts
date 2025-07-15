// src/ventas/dto/create-venta.dto.ts
import { CreateVentaDetalleDto } from '../../venta-detalle/dto/create-venta-detalle.dto';
import { CreateVentaPagoDto } from '../../venta-pagos/dto/create-venta-pago.dto';

export class CreateVentaDto {
  clienteId: number;
  detalles: CreateVentaDetalleDto[];
  pagos: CreateVentaPagoDto[];
}

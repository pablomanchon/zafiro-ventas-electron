import { CreateItemVentaDto } from "../../item-venta/dto/create-item-venta.dto";

// src/venta-detalle/dto/create-venta-detalle.dto.ts
export class CreateVentaDetalleDto {
  productoId: number;
  item: CreateItemVentaDto;
}

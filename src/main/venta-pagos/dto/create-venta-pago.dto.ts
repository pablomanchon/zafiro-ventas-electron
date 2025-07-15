// src/ventas/dto/create-venta-pago.dto.ts
export class CreateVentaPagoDto {
  metodoId: number;
  monto: number;
  cuotas?: number;
}

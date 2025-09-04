// src/ventas/dto/create-venta-pago.dto.ts
export class CreateVentaPagoDto {
  metodoId: string;
  monto: number;
  cuotas?: number;
}

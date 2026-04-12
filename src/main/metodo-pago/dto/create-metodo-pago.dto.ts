// src/metodos-pago/dto/create-metodo-pago.dto.ts
export class CreateMetodoPagoDto {
  /** Identificador que defines tú (p. ej. 'efectivo', 'tarjeta1', etc.) */
  id: string;
  nombre: string;
  tipo: 'debito' | 'credito' | 'efectivo' | 'pendiente' | 'usd' | 'otro';
}

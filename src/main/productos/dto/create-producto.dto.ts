// src/productos/dto/create-producto.dto.ts
export class ProductoDto {
  id?: number;
  nombre: string;
  descripcion?: string;
  codigo?:string;
  precio: number;
  stockMinimo?: number;
  stock_minimo?: number;
}

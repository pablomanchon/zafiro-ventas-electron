// src/productos/dto/create-producto.dto.ts
export class CreateProductoDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  sku?: string;
}

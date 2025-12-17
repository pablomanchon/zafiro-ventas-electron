// src/productos/dto/create-producto.dto.ts
export class ProductoDto {
  id?: string;
  nombre: string;
  descripcion?: string;
  codigo?:string;
  precio: number;
  stock: number;
}

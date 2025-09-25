import type { CrudConfig } from '../CrudConfig';

const productosConfig: CrudConfig = {
  entity: 'productos',
  title: 'Productos',
  columns: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'sku'],
  searchFields: ['id', 'nombre', 'descripcion', 'sku'],
  formInputs: [
    { name: 'id', label: "Id", type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'stock', label: 'Stock', type: 'number', required: true }
  ],
};

export default productosConfig;

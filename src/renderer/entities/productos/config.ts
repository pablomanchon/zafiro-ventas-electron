import type { CrudConfig } from '../CrudConfig';

const productosConfig: CrudConfig = {
  entity: 'productos',
  title: 'Productos',
  columns: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'sku'],
  searchFields: ['nombre', 'descripcion', 'sku'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'stock', label: 'Stock', type: 'number', required: true },
    { name: 'sku', label: 'SKU', type: 'text' },
  ],
};

export default productosConfig;

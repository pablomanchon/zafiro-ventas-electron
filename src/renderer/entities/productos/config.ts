import type { CrudConfig } from '../CrudConfig';

const productosConfig: CrudConfig = {
  entity: 'productos',
  title: 'Productos',
  columns: [
    'codigo',
    'nombre',
    'descripcion',
    'precio',
    'stock',
  ],
  searchFields: ['codigo', 'nombre', 'descripcion'],
  formInputs: [
    { name: 'codigo', label: "Codigo", type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'stock_minimo', label: 'Stock minimo', type: 'number', required: true, value: 0 }
  ],
};

export default productosConfig;

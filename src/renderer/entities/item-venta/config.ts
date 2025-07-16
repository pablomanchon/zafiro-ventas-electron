import { CrudConfig } from '../CrudConfig';

const itemVentaConfig: CrudConfig = {
  entity: 'item-venta',
  title: 'Items de Venta',
  columns: ['id', 'nombre', 'descripcion', 'precio', 'cantidad'],
  searchFields: ['nombre', 'descripcion'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'precio', label: 'Precio', type: 'number', required: true },
    { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
  ],
};

export default itemVentaConfig;

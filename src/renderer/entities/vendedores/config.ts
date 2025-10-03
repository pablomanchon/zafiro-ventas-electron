import type { CrudConfig } from '../CrudConfig';

const vendedoresConfig: CrudConfig = {
  entity: 'vendedores',
  title: 'Vendedores',
  columns: ['id', 'nombre'],
  searchFields: ['id', 'nombre'],
  formInputs: [
    { name: 'id', label: 'Id', type: 'number', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  ],
};

export default vendedoresConfig;

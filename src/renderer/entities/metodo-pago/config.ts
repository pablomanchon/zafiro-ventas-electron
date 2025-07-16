import type { CrudConfig } from '../CrudConfig';

const metodoPagoConfig: CrudConfig = {
  entity: 'metodo-pago',
  title: 'Métodos de Pago',
  columns: ['id', 'nombre', 'descripcion'],
  searchFields: ['nombre', 'descripcion'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
  ],
};

export default metodoPagoConfig;

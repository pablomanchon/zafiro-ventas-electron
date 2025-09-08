import type { CrudConfig } from '../CrudConfig';

const metodoPagoConfig: CrudConfig = {
  entity: 'metodo-pago',
  title: 'Métodos de Pago',
  columns: ['ID', 'Nombre'],
  searchFields: ['id', 'nombre'],
  formInputs: [
    { name: 'id', label: "Id", type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    {
      name: 'tipo',
      label: 'Tipo de Pago',
      type: 'select',
      required: true,
      options: [
        { label: '-', value: '' },
        { label: 'Debito', value: 'debito' },
        { label: 'Credito', value: 'credito' },
        { label: 'Efectivo', value: 'efectivo' },
        { label: 'USD', value: 'usd' },
        { label: 'Prendiente', value: 'prendiente' },
        { label: 'Otro', value: 'otro' },
      ],
    },
  ],
};

export default metodoPagoConfig;

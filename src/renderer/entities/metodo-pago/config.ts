import type { CrudConfig } from '../CrudConfig'

const metodoPagoConfig: CrudConfig = {
  entity: 'metodo-pago',
  title: 'Metodos de Pago',
  columns: ['ID', 'Nombre'],
  searchFields: ['id', 'nombre'],
  formInputs: [
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
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Otro', value: 'otro' },
      ],
    },
  ],
}

export default metodoPagoConfig

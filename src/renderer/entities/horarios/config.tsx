import type { CrudConfig } from '../CrudConfig';

const horariosConfig: CrudConfig = {
  entity: 'clientes',
  title: 'Clientes',
  columns: [
    { titulo: 'ID', clave: 'vendedor.id' },
    { titulo: 'Vendedor', clave: 'vendedor.nombre' },
    { titulo: 'Hora Ingreso', clave: 'horaIngreso' }, // Table detecta "fecha" por key; acá lo dejamos así (muestra string si no parsea)
    { titulo: 'Hora Egreso', clave: 'horaEgreso' },
    {
      titulo: 'Estado',
      clave: 'estado',
    },
  ],
  searchFields: ['vendedor.id', 'nombre', 'apellido', 'email'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'apellido', label: 'Apellido', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'direccion', label: 'Dirección', type: 'text' },
  ],
};

export default horariosConfig;
